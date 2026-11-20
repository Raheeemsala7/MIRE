import "server-only";

import { cache } from "react";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authorizeCredentials } from "@/lib/auth/credentials";
import { getSession } from "@/lib/auth/session-store";
import { validatedBackendSession, revokeBackendSession } from "@/lib/auth/backend-session";
import { SESSION_COOKIE, REMEMBER_ME_SECONDS, sessionCookieOptions } from "@/lib/auth/policy";

const nextAuth = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  pages: { signIn: "/auth/login" },
  session: { strategy: "jwt", maxAge: REMEMBER_ME_SECONDS },
  cookies: {
    sessionToken: {
      name: SESSION_COOKIE,
      options: sessionCookieOptions(false, process.env.NODE_ENV === "production"),
    },
  },
  providers: [Credentials({
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
      rememberMe: { label: "Remember me", type: "checkbox" },
      proof: { label: "Proof", type: "hidden" },
    },
    authorize: authorizeCredentials,
  })],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        if (!user.id || !user.role || !user.sessionId) return null;
        // The backend ID and the private session-store reference are distinct.
        return {
          sub: user.id, sessionId: user.sessionId,
          user: { id: user.id, name: user.name ?? "", email: user.email ?? "",
            role: user.role, permissions: user.permissions },
        };
      }
      if (!token.sessionId) return null;
      const record = await validatedBackendSession(token.sessionId);
      if (!record) return null;
      // Ignore client-supplied session updates; role metadata is always backend-owned.
      return { sub: record.user.id, sessionId: token.sessionId,
        user: record.user, sessionExpires: record.expiresAt.toISOString() };
    },
    async session({ token }) {
      if (!token.user || !token.sessionExpires) throw new Error("Invalid authentication session");
      return { user: {
        id: token.user.id, name: token.user.name, email: token.user.email,
        role: token.user.role,
        ...(token.user.permissions ? { permissions: token.user.permissions } : {}),
      }, expires: token.sessionExpires };
    },
  },
  events: {
    async signOut(message) {
      if ("token" in message && message.token?.sessionId) {
        await revokeBackendSession(message.token.sessionId);
      }
    },
  },
  // Preserve existing opaque cookies and revocable, encrypted token storage.
  // Auth.js owns identity; this codec never puts backend credentials in its cookie.
  jwt: {
    async encode({ token }) { return token?.sessionId ?? ""; },
    async decode({ token }) {
      if (!token) return null;
      const record = await getSession(token);
      return record ? { sessionId: token, sub: record.user.id } : null;
    },
  },
});

export const { handlers, signIn, signOut } = nextAuth;
// React cache deduplicates within a render, never across requests or users.
export const auth = cache(async () => nextAuth.auth());
