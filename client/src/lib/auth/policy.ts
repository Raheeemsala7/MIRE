export const SESSION_COOKIE = "mire_session";
export const REMEMBER_ME_SECONDS = 30 * 24 * 60 * 60;
export const SESSION_IDLE_MS = 12 * 60 * 60_000;

export function sessionDeadline(createdAt: Date, rememberMe: boolean) {
  return new Date(createdAt.getTime() + (rememberMe ? REMEMBER_ME_SECONDS * 1000 : SESSION_IDLE_MS));
}

export function sessionCookieOptions(rememberMe: boolean, production: boolean) {
  return {
    httpOnly: true as const,
    secure: production,
    sameSite: "lax" as const,
    path: "/" as const,
    ...(rememberMe ? { maxAge: REMEMBER_ME_SECONDS } : {}),
  };
}
