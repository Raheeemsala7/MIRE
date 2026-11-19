import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { MongoClient } from "mongodb";

const base = process.env.AUTH_SMOKE_URL || "http://localhost:3011";
const required = ["AUTH_SMOKE_ADMIN_EMAIL", "AUTH_SMOKE_ADMIN_PASSWORD", "AUTH_SMOKE_CUSTOMER_EMAIL", "AUTH_SMOKE_CUSTOMER_PASSWORD"];
for (const name of required) {
  if (!process.env[name]) throw new Error(`${name} is required`);
}

const manifest = JSON.parse(await readFile(join(process.cwd(), ".next/server/server-reference-manifest.json"), "utf8"));
const actions = Object.entries(manifest.node);
const actionId = (name) => actions.find(([, value]) => value.exportedName === name)?.[0];
assert.ok(actionId("loginAction"));
assert.ok(actionId("logoutAction"));

async function action(path, name, args, cookie) {
  return fetch(`${base}${path}`, {
    method: "POST", redirect: "manual",
    headers: {
      "Next-Action": actionId(name), Accept: "text/x-component",
      Origin: base, "Content-Type": "text/plain;charset=UTF-8",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(args),
  });
}

function sessionCookie(response) {
  const header = response.headers.getSetCookie().find((value) => value.startsWith("mire_session="));
  assert.ok(header, "session cookie missing");
  const value = /^mire_session=([^;]+)/.exec(header)?.[1];
  assert.ok(value, "session ID missing");
  assert.match(header, /HttpOnly/i);
  assert.match(header, /SameSite=lax/i);
  return { header, cookie: `mire_session=${value}` };
}

async function page(path, cookie) {
  const response = await fetch(`${base}${path}`, { headers: { Cookie: cookie }, redirect: "manual" });
  return { response, html: await response.text() };
}

async function verifyRotation(cookie, path, fixedDeadline) {
  if (!process.env.SESSION_MONGODB_URI) return;
  const mongo = await new MongoClient(process.env.SESSION_MONGODB_URI).connect();
  try {
    const sessions = mongo.db().collection("next_auth_sessions");
    const id = createHash("sha256").update(cookie.slice("mire_session=".length)).digest("hex");
    const before = await sessions.findOne({ _id: id });
    assert.ok(before);
    await sessions.updateOne({ _id: id }, { $set: { accessTokenExpiresAt: new Date(Date.now() - 1) } });
    const [first, second] = await Promise.all([page(path, cookie), page(path, cookie)]);
    assert.match(first.html, /Welcome/);
    assert.match(second.html, /Welcome/);
    const after = await sessions.findOne({ _id: id });
    assert.equal(after.version, before.version + 1);
    assert.notEqual(after.encryptedRefreshToken, before.encryptedRefreshToken);
    if (fixedDeadline) assert.equal(after.expiresAt.getTime(), before.expiresAt.getTime());
    else assert.ok(after.expiresAt.getTime() >= before.expiresAt.getTime());
  } finally {
    await mongo.close();
  }
}

const guest = await page("/admin/dashboard", "");
assert.equal(guest.response.status, 307);
assert.equal(guest.response.headers.get("location"), "/login");

const customerLogin = await action("/login", "loginAction", [{
  email: process.env.AUTH_SMOKE_CUSTOMER_EMAIL,
  password: process.env.AUTH_SMOKE_CUSTOMER_PASSWORD,
  rememberMe: false,
}]);
const customerResult = await customerLogin.text();
assert.match(customerResult, /"success":true/);
assert.match(customerResult, /"destination":"\/store"/);
const customer = sessionCookie(customerLogin);
assert.doesNotMatch(customer.header, /Max-Age|Expires/i);

const customerStore = await page("/store", customer.cookie);
assert.equal(customerStore.response.status, 200);
assert.match(customerStore.html, /Welcome back/);
assert.doesNotMatch(customerStore.html, /accessToken|refreshToken/);
const customerAdmin = await page("/admin/dashboard", customer.cookie);
assert.match(customerAdmin.html, /NEXT_REDIRECT;replace;\/403/);
assert.doesNotMatch(customerAdmin.html, /Welcome, /);

const visibleSession = await fetch(`${base}/api/auth/session`, { headers: { Cookie: customer.cookie } });
const safeSession = await visibleSession.text();
assert.doesNotMatch(safeSession, /accessToken|refreshToken/);
assert.match(safeSession, /nour@example.com|"user"/);

await verifyRotation(customer.cookie, "/store", false);

await action("/store", "logoutAction", [], customer.cookie);

const adminLogin = await action("/login", "loginAction", [{
  email: process.env.AUTH_SMOKE_ADMIN_EMAIL,
  password: process.env.AUTH_SMOKE_ADMIN_PASSWORD,
  rememberMe: true,
}]);
const adminResult = await adminLogin.text();
assert.match(adminResult, /"success":true/);
assert.match(adminResult, /"destination":"\/admin\/dashboard"/);
const admin = sessionCookie(adminLogin);
assert.match(admin.header, /Max-Age=2592000/);
await verifyRotation(admin.cookie, "/admin/dashboard", true);
const dashboard = await page("/admin/dashboard", admin.cookie);
assert.match(dashboard.html, /Welcome, /);
assert.doesNotMatch(dashboard.html, /accessToken|refreshToken/);
const adminStore = await page("/store", admin.cookie);
assert.match(adminStore.html, /NEXT_REDIRECT;replace;\/403/);

const logout = await action("/admin/dashboard", "logoutAction", [], admin.cookie);
assert.ok(logout.headers.getSetCookie().some((value) => /^mire_session=;/.test(value)));
const afterLogout = await page("/admin/dashboard", admin.cookie);
assert.doesNotMatch(afterLogout.html, /Welcome, /);

console.log("Auth smoke test passed: guest guard, both roles, both cookie policies, safe session, refresh rotation, and logout.");
