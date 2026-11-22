import type { SafeUser } from "@/lib/auth/types";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id?: string;
    role?: SafeUser["role"];
    permissions?: string[];
    accessToken?: string;
    refreshToken?: string;
  }

  interface Session {
    user: SafeUser & {
      emailVerified?: Date | null;
    };
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    user?: SafeUser;
    accessToken?: string;
    refreshToken?: string;
  }
}

export {};
