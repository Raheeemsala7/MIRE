# Authentication setup

Auth.js is the frontend identity authority. Server layouts, pages, guards, and API handlers read `auth()` from `src/auth.ts`. Its public session contains only `user: { id, name, email, role, permissions? }` and `expires`. `id` is the backend user ID; the opaque session-store reference is a separate internal field and is never returned in the public session. The compatibility `currentSession()` and `currentUser()` helpers delegate to Auth.js and cannot return backend tokens.

## Identity and authorization

Credentials are validated by the existing backend login endpoint. `authorizeCredentials()` returns the trusted backend identity and a private session reference to the Auth.js JWT callback. Subsequent Auth.js session reads validate the server record, refresh tokens if needed, and fetch `/auth/me` with the access token. The response is schema-validated and must match the original backend user ID. Current roles, permissions, account deletion, and deactivation therefore take effect on the next request. An outage never falls back to a stale privileged identity.

`ADMIN_ROLES`, `isAdminRole`, `isCustomerRole`, `hasRole`, and `hasPermission` live in `src/lib/auth/roles.ts`. Employee-management checks also retain the existing, narrower application policy in `config/rbac.config.ts`; missing backend permission metadata denies access. The external backend remains authoritative for each protected operation. Analytics, recent-order, and stock widgets require their respective backend permissions. Client visibility is only presentation.

The platform layout renders `@admin` for validated staff and `@user` for CUSTOMER, redirects guests to localized login, and rejects unknown roles. Nested admin layouts and pages perform their own authorization. Default slots redirect safely on hard navigation instead of returning an empty page. URLs remain localized: `/ar/auth/login`, `/en/auth/login`, `/ar/admin/dashboard`, `/en/admin/dashboard`, and customer storefront `/ar` or `/en`. Legacy `/login`, `/auth/login`, and `/store` entrypoints redirect through the proxy. The requested platform guard means the storefront now requires authentication.

Login redirects respect the active locale. Callback URLs are restricted to known, authorized local destinations; foreign origins, protocol-relative URLs, unknown paths, and unauthorized admin destinations are rejected. Login uses a full navigation to discard the previous account's client query cache. Client components receive safe server-provided identity, so a global SessionProvider is unnecessary.

## Server token lifecycle

Backend tokens remain in `next_auth_sessions` in MongoDB, AES-256-GCM encrypted; record keys hash the opaque browser ID with SHA-256. No backend access or refresh token is put in an Auth.js public session, browser storage, client props, or a client bundle.

The existing Credentials JWT strategy and custom opaque-cookie codec are retained for compatibility. This is deliberately a revocable server-backed session, not a stateless JWT cookie. Auth.js owns frontend identity; MongoDB only supplies its private token lifecycle and revocation record. Do not bypass Auth.js by using a stored user snapshot for authorization.

Refresh preserves the existing MongoDB lease and versioned atomic token rotation. Parallel refresh callers reuse the winning rotation. A request whose old access token received a 401 will reuse a newer committed version when available. Protected backend calls retry at most once on 401; a second rejection deletes the local session. Backend permission denials are not retried.

Logout revokes the local record before attempting backend logout, calls Auth.js signOut, clears the cookie, and returns to localized login. The Auth.js signOut event also revokes the backend reference, covering direct Auth.js sign-out requests.

Backend limitations remain: it stores one refresh token per account and does not expose token introspection. Revocation of that refresh token on another device is discovered at the next refresh, while role changes and deactivation are checked on every identity request. If backend rotation succeeds but the process fails before committing the replacement, reauthentication is necessary. Backend logout is best effort during an outage; local revocation still prevents reuse of the frontend cookie.

## Remember me

Checked: a persistent cookie and a fixed server deadline of at most 30 days from login. Unchecked: a browser-session cookie and the existing 12-hour sliding inactivity policy. Both depend on backend token validity.

Auth.js normally rolls JWT cookies using one global maxAge. The API handler therefore normalizes its Set-Cookie output: unchecked sessions never gain Expires/Max-Age, and remembered sessions never extend beyond the original record deadline. Server login proofs prevent direct Credentials callbacks from bypassing per-login policy. Browser session restoration behavior remains browser-dependent; the server idle deadline is still enforced.

## Rendering

Request-dependent authentication runs inside Suspense at platform, nested admin, and affected page boundaries. Pages have their own boundaries so partial navigation does not depend on a reused parent layout. Existing dashboard and employee skeletons provide loading feedback. The locale layout passes an explicit locale to `getMessages`, avoiding a shared request-locale read outside the boundary. Cache Components and Partial Prefetching stay enabled; a single `await connection()` boundary in `getSession()` keeps MongoDB driver clocks and expiry checks at request time, including partial prefetches that already know the cookie. The locale document layout alone exports `instant = false`: its URL parameter determines `<html lang>` and `dir`, which must resolve before the document renders. This scoped exception leaves descendant page validation, Suspense boundaries, Cache Components, and Partial Prefetching enabled. No layout-wide `connection()` calls are needed. React cache only deduplicates within a render; no user session is placed in a cross-request cache.

## Configuration and verification

Set server-only `BACKEND_API_URL`, `SESSION_MONGODB_URI`, `AUTH_SECRET` (at least 32 characters), and `TOKEN_ENCRYPTION_KEY` (a separate base64-encoded 32-byte key). Do not prefix these with NEXT_PUBLIC. Use HTTPS in production for Secure cookies. Auth.js is configured to trust the host, so production ingress must validate Host/forwarded headers and expose only the intended application origin.

Run from `client/`: `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint`, and `pnpm build`. The regression suite covers all seven roles, backend identity binding and role changes, revoked sessions, Auth.js public-session filtering and sign-out, per-login cookie renewal, bounded refresh retries and concurrency, server guards, permissions, localized destinations, and unsafe callbacks. Tests mock backend and database I/O; they do not prove connectivity to the deployed services.

For end-to-end verification, use disposable accounts with the updated `pnpm test:auth:smoke` script. It requires AUTH_SMOKE_ADMIN_EMAIL, AUTH_SMOKE_ADMIN_PASSWORD, AUTH_SMOKE_CUSTOMER_EMAIL, and AUTH_SMOKE_CUSTOMER_PASSWORD, plus a running local app/backend. AUTH_SMOKE_URL defaults to http://localhost:3011. Setting SESSION_MONGODB_URI enables the optional rotation check, which expires the test account's access-token record before checking concurrent refresh. Do not use real customer accounts for this script.

Live app startup was blocked by automatic approval review because an earlier security-audit instruction requires an isolated runtime sandbox. Browser navigation, authenticated hard refresh, and live backend flows remain unverified in this run. Production compilation/prerendering and mocked regression tests were permitted.

## Refactor file inventory

Paths are relative to the repository root. Existing in-progress edits were retained; this list includes files also touched by this refactor. The pre-existing next-intl request configuration change was left intact.

- `client/AUTH.md`
- `client/scripts/auth-smoke.mjs`
- `client/src/app/[locale]/(auth)/403/page.tsx`
- `client/src/app/[locale]/(auth)/auth/forgot-password/page.tsx`
- `client/src/app/[locale]/(auth)/auth/login/page.tsx`
- `client/src/app/[locale]/(auth)/auth/reset-password/page.tsx`
- `client/src/app/[locale]/(auth)/layout.tsx`
- `client/src/app/[locale]/(platform)/@admin/admin/dashboard/page.tsx`
- `client/src/app/[locale]/(platform)/@admin/admin/employees/[id]/page.tsx`
- `client/src/app/[locale]/(platform)/@admin/admin/employees/page.tsx`
- `client/src/app/[locale]/(platform)/@admin/admin/layout.tsx`
- `client/src/app/[locale]/(platform)/@admin/default.tsx`
- `client/src/app/[locale]/(platform)/@user/(website)/account/page.tsx`
- `client/src/app/[locale]/(platform)/@user/(website)/orders/page.tsx`
- `client/src/app/[locale]/(platform)/@user/default.tsx`
- `client/src/app/[locale]/(platform)/layout.tsx`
- `client/src/app/[locale]/layout.tsx`
- `client/src/app/api/admin/analytics/route.ts`
- `client/src/app/api/admin/employees/[id]/route.ts`
- `client/src/app/api/admin/employees/[id]/toggle-status/route.ts`
- `client/src/app/api/admin/employees/route.ts`
- `client/src/app/api/admin/inventory/low-stock/route.ts`
- `client/src/app/api/admin/orders/recent/route.ts`
- `client/src/app/api/auth/[...nextauth]/route.ts`
- `client/src/app/api/auth/clear-session/route.ts`
- `client/src/auth.test.ts`
- `client/src/auth.ts`
- `client/src/config/rbac.config.ts`
- `client/src/features/analytics/components/analytics-dashboard.tsx`
- `client/src/features/analytics/hooks/use-analytics.ts`
- `client/src/features/auth/actions/login.test.ts`
- `client/src/features/auth/actions/login.ts`
- `client/src/features/auth/actions/logout.test.ts`
- `client/src/features/auth/actions/logout.ts`
- `client/src/features/auth/components/auth-skeleton.tsx`
- `client/src/features/auth/components/forgot-password-form.tsx`
- `client/src/features/auth/components/login/login-form.tsx`
- `client/src/features/auth/components/register/register-form.tsx`
- `client/src/features/auth/components/reset-password-form.tsx`
- `client/src/features/auth/hooks/use-login.ts`
- `client/src/features/auth/lib/locale.ts`
- `client/src/features/employees/components/create-employee-dialog.tsx`
- `client/src/features/employees/components/edit-employee-dialog.tsx`
- `client/src/features/employees/components/employee-details.tsx`
- `client/src/features/employees/components/employees-table.tsx`
- `client/src/features/employees/utils/employee.util.ts`
- `client/src/lib/auth/backend-client.ts`
- `client/src/lib/auth/backend-session.test.ts`
- `client/src/lib/auth/backend-session.ts`
- `client/src/lib/auth/credentials.test.ts`
- `client/src/lib/auth/credentials.ts`
- `client/src/lib/auth/handler-cookies.test.ts`
- `client/src/lib/auth/handler-cookies.ts`
- `client/src/lib/auth/permissions.ts`
- `client/src/lib/auth/policy.test.ts`
- `client/src/lib/auth/refresh-token.test.ts`
- `client/src/lib/auth/refresh-token.ts`
- `client/src/lib/auth/roles.test.ts`
- `client/src/lib/auth/roles.ts`
- `client/src/lib/auth/session.test.ts`
- `client/src/lib/auth/session.ts`
- `client/src/lib/permissions/can.test.ts`
- `client/src/lib/permissions/can.ts`
- `client/src/lib/permissions/server-authorization.test.ts`
- `client/src/lib/permissions/server-authorization.ts`
- `client/src/proxy.ts`
- `client/src/shared/components/admin-nav.tsx`
- `client/src/shared/components/header.tsx`
- `client/src/shared/context/providers.tsx`
- `client/src/types/next-auth.d.ts`
- `client/vitest.config.mts`
