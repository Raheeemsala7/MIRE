import "server-only";

import { cache } from "react";
import { connection } from "next/server";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { backendLogin, backendRefresh } from "@/lib/auth/backend-client";
import type { SafeUser } from "@/lib/auth/types";

function getJwtExpiryMs(jwtToken?: string): number {
  if (!jwtToken) return 0;
  try {
    const parts = jwtToken.split(".");
    if (parts.length !== 3) return 0;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = Buffer.from(base64, "base64").toString("utf-8");
    const payload = JSON.parse(jsonPayload);
    return typeof payload.exp === "number" ? payload.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

const nextAuth = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 90 * 24 * 60 * 60, // 90 days max session window (remember me)
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const isRememberMe =
          credentials.rememberMe === "true" || credentials.rememberMe === true;

        try {
          const res = await backendLogin(
            String(credentials.email),
            String(credentials.password),
            isRememberMe
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
            rememberMe: isRememberMe,
            accessTokenExpires: getJwtExpiryMs(res.accessToken),
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // 1. Initial sign-in: store user and tokens
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
        token.rememberMe = (user as any).rememberMe;
        token.accessTokenExpires =
          (user as any).accessTokenExpires ||
          getJwtExpiryMs((user as any).accessToken);
        delete token.error;
        return token;
      }

      // 2. Return previous token if the access token has not expired yet (with 60s buffer)
      const expiresAt =
        token.accessTokenExpires ||
        getJwtExpiryMs(token.accessToken as string);

      if (expiresAt && Date.now() < expiresAt - 60 * 1000) {
        return token;
      }

      // 3. Access token has expired, refresh it using the backend refresh token
      if (token.refreshToken) {
        try {
          const refreshed = await backendRefresh(token.refreshToken as string);
          token.accessToken = refreshed.accessToken;
          if (refreshed.refreshToken) {
            token.refreshToken = refreshed.refreshToken;
          }
          token.accessTokenExpires = getJwtExpiryMs(refreshed.accessToken);
          delete token.error;
          return token;
        } catch (error) {
          console.error("Auth.js error refreshing token:", error);
          token.error = "RefreshAccessTokenError";
          return token;
        }
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
      if (token.error) {
        session.error = token.error as string;
      }
      return session;
    },
  },
});

export const { handlers, signIn, signOut } = nextAuth;

export const getServerSession = cache(async (..._args: any[]) => {
  await connection();
  return nextAuth.auth();
});

export const auth = getServerSession;
export const authOptions = {};

