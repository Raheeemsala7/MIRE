export const AUTH_COOKIE_NAMES = [
  process.env.NEXT_AUTH_SESSION_COOKIE_NAME,
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "authjs.csrf-token",
  "__Host-authjs.csrf-token",
  "next-auth.csrf-token",
  "authjs.callback-url",
  "next-auth.callback-url",
].filter(Boolean) as string[];
