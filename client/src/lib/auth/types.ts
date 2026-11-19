export type AppRole =
  | "SUPER_ADMIN" | "ADMIN" | "ORDER_MANAGER" | "CUSTOMER_SUPPORT"
  | "INVENTORY_MANAGER" | "ACCOUNTANT" | "CUSTOMER";

export type SafeUser = {
  id: string;
  name: string;
  email: string;
  role: AppRole;
};

export type SessionRecord = {
  _id: string;
  user: SafeUser;
  rememberMe: boolean;
  createdAt: Date;
  expiresAt: Date;
  lastActivityAt: Date;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
  version: number;
  refreshLeaseUntil?: Date;
};
