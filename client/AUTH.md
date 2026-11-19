# Authentication setup

The Next.js app uses Auth.js Credentials to authenticate against the existing Express API. It stores backend tokens only in the `next_auth_sessions` MongoDB collection. The browser receives an opaque `mire_session` cookie. The collection stores the SHA-256 hash of that ID and AES-256-GCM encrypted tokens.

Login stays at `src/app/(auth)/login/page.tsx` (`/login`). Registration stays at `src/app/[locale]/auth/register/page.tsx` (`/ar/auth/register` and `/en/auth/register`). `/login` reads the storefront's `NEXT_LOCALE` cookie and defaults to Arabic. Both forms use React Hook Form, shared Field primitives, Zod validation, and translated error messages.

Authentication UI lives in `src/features/auth/components/login` and `components/register`; the password input is shared at `components/password-input.tsx`. Form orchestration lives in `hooks`, mutations in `actions`, and validation in `schemas`. `src/auth.ts` wires Auth.js to `src/lib/auth/credentials.ts`, while `src/lib/auth/backend-client.ts` handles login, registration, refresh, and logout requests. Registration discards backend tokens and directs the new user to sign in.

Copy `.env.example` to `.env.local` and set:

- `BACKEND_API_URL`: the backend API base, including `/api/v1` (a bare origin is also accepted).
- `SESSION_MONGODB_URI`: a MongoDB URI for a database writable by the Next.js server. A TTL index on `expiresAt` is created automatically.
- `AUTH_SECRET`: a random secret of at least 32 characters.
- `TOKEN_ENCRYPTION_KEY`: a different random 32-byte key encoded with base64.

Do not set any of these as `NEXT_PUBLIC_*`. Use HTTPS in production so the session cookie is marked `Secure`.

`ADMIN` and `SUPER_ADMIN` enter `/admin/dashboard`; the backend's `CUSTOMER` role enters `/store`. Other staff roles reach `/403` until dedicated pages and permissions are added. The public storefront under `/ar` and `/en` remains available to guests.

Remember Me keeps the browser cookie and server session for at most 30 days from login. Without it, the browser cookie is a session cookie and the server session expires after 12 hours of inactivity. Both modes depend on the backend's refresh token. A revoked or expired backend refresh token ends the frontend session. The backend stores one refresh token per account, so signing in on another device invalidates the earlier device's refresh token. If the backend successfully rotates a refresh token but the Next.js process fails before committing the replacement to MongoDB, the user must sign in again.

Run `pnpm test`, `pnpm lint`, `pnpm exec tsc --noEmit`, and `pnpm build` from `client/` to validate the implementation.

For a full local flow check, start the built app and backend, set `AUTH_SMOKE_ADMIN_EMAIL`, `AUTH_SMOKE_ADMIN_PASSWORD`, `AUTH_SMOKE_CUSTOMER_EMAIL`, and `AUTH_SMOKE_CUSTOMER_PASSWORD` to disposable seed accounts, then run `pnpm test:auth:smoke`. Set `SESSION_MONGODB_URI` as well to check concurrent refresh rotation and the unchanged session deadline. The smoke script checks both roles, both cookie policies, route guards, safe session responses, and logout. It uses HTTP directly so it can test `Secure` cookies on a local HTTP server without changing production cookie settings.
