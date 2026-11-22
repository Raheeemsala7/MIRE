/** Client-side helper to clear tokens and redirect to login when session expires */
let isRedirecting = false;

export function handleClientSessionExpired(locale: string = "ar") {
  if (typeof window === "undefined" || isRedirecting) return;

  // Don't loop if already on the login page
  if (window.location.pathname.includes("/auth/login")) return;

  isRedirecting = true;

  // Best-effort client cookie deletion
  const cookieNames = [
    "authjs.session-token",
    "__Secure-authjs.session-token",
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
  ];
  for (const name of cookieNames) {
    document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
  }

  const currentPath = window.location.pathname;
  const isEn = currentPath.startsWith("/en");
  const loginLocale = isEn ? "en" : locale;
  const callbackUrl = encodeURIComponent(window.location.pathname + window.location.search);

  window.location.href = `/${loginLocale}/auth/login?expired=1&callbackUrl=${callbackUrl}`;
}
