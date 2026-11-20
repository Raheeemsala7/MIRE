import "server-only";
import { getSession } from "./session-store";
import { SESSION_COOKIE } from "./policy";

/** Auth.js rolls JWT cookies to its global maxAge. Preserve per-login policy. */
export async function preserveSessionCookiePolicy(response: Response): Promise<Response> {
  const values = response.headers.getSetCookie();
  response.headers.delete("set-cookie");
  for (const value of values) {
    const pair = value.split(";", 1)[0];
    if (!pair.startsWith(`${SESSION_COOKIE}=`) || pair === `${SESSION_COOKIE}=`) {
      response.headers.append("set-cookie", value);
      continue;
    }
    const record = await getSession(pair.slice(SESSION_COOKIE.length + 1));
    if (!record) {
      response.headers.append("set-cookie", `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
      continue;
    }
    let normalized = value.replace(/;\s*(Expires|Max-Age)=[^;]*/gi, "");
    if (record.rememberMe) normalized += `; Expires=${record.expiresAt.toUTCString()}`;
    response.headers.append("set-cookie", normalized);
  }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
