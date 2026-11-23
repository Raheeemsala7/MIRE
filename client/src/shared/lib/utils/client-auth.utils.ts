import { clearBrowserQueryCache } from "@/shared/context/global/react-query-providers";

/** Client-side helper to clear tokens and redirect to login when session expires */
let isRedirecting = false;

export function handleClientSessionExpired(locale: string = "ar") {
  if (typeof window === "undefined" || isRedirecting) return;

  // Clear query cache and storage on session expiry
  try {
    clearBrowserQueryCache();
    localStorage.removeItem("mire-recent-orders");
    sessionStorage.removeItem("mire-recent-orders");
  } catch {}

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
  const isAdminRoute =
    /^\/(ar|en)?\/admin(?:\/|$)/.test(currentPath) ||
    currentPath.includes("/admin");

  // CRITICAL: Public storefront visitors and landing page guests should NEVER be redirected to login!
  // Only redirect if the user was actively navigating within the admin dashboard.
  if (!isAdminRoute) {
    return;
  }

  // Don't loop if already on the login page
  if (currentPath.includes("/auth/login")) return;

  isRedirecting = true;
  const isEn = currentPath.startsWith("/en");
  const loginLocale = isEn ? "en" : locale;
  const callbackUrl = encodeURIComponent(window.location.pathname + window.location.search);

  window.location.href = `/${loginLocale}/auth/login?expired=1&callbackUrl=${callbackUrl}`;
}
