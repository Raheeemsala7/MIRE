import "server-only";

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authorizeCredentials } from "@/lib/auth/credentials";
import { getSession } from "@/lib/auth/session-store";
import { SESSION_COOKIE, REMEMBER_ME_SECONDS, sessionCookieOptions } from "@/lib/auth/policy";

export const { handlers, signIn, auth } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  pages: { signIn: "/login" },
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
      if (user?.id) token.sessionId = user.id;
      return token;
    },
    async session({ session, token }) {
      const id = typeof token.sessionId === "string" ? token.sessionId : "";
      const record = await getSession(id);
      session.user.name = record?.user.name ?? "";
      session.user.email = record?.user.email ?? "";
      if (record) session.expires = record.expiresAt.toISOString() as typeof session.expires;
      return session;
    },
  },
  // Credentials requires the JWT strategy; the codec stores only an opaque
  // session ID in the cookie. Backend tokens remain encrypted in MongoDB.
  jwt: {
    async encode({ token }) {
      return typeof token?.sessionId === "string" ? token.sessionId : "";
    },
    async decode({ token }) {
      if (!token) return null;
      const record = await getSession(token);
      return record ? { sessionId: token, sub: record.user.id, name: record.user.name, email: record.user.email } : null;
    },
  },
});
