import "server-only";

import { cache } from "react";
import { connection } from "next/server";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { backendLogin } from "@/lib/auth/backend-client";
import type { SafeUser } from "@/lib/auth/types";

const nextAuth = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET || "tD+4cODqaNMJnlZAki/dDOqjC4QldbtyckSBmMin/58=",
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const res = await backendLogin(
            String(credentials.email),
            String(credentials.password)
          );

          if (!res?.user || !res?.accessToken) {
            return null;
          }

          return {
            id: res.user._id,
            name: res.user.name,
            email: res.user.email,
            role: res.user.role,
            permissions: res.user.permissions || [],
            accessToken: res.accessToken,
            refreshToken: res.refreshToken,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.user = {
          id: (user.id ?? "") as string,
          name: user.name ?? "",
          email: user.email ?? "",
          role: (user as any).role,
          permissions: (user as any).permissions || [],
        };
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.user) {
        session.user = {
          ...session.user,
          id: (token.user as SafeUser).id,
          name: (token.user as SafeUser).name,
          email: (token.user as SafeUser).email,
          role: (token.user as SafeUser).role,
          permissions: (token.user as SafeUser).permissions,
        };
      }
      if (token.accessToken) {
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
});

export const { handlers, signIn, signOut } = nextAuth;

export const auth = cache(async () => {
  await connection();
  return nextAuth.auth();
});
