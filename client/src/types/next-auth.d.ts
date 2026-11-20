import type { SafeUser } from "@/lib/auth/types";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    role?: SafeUser["role"];
    permissions?: string[];
    /** Server-only provider result, never copied into the public session. */
    sessionId?: string;
  }
  interface Session {
    user: SafeUser;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sessionId?: string;
    user?: SafeUser;
    sessionExpires?: string;
  }
}

export {};
