# AGENTS.md

## Project Overview

Secure DMZ web app template: React + Express + PostgreSQL + NGINX with auth, 2FA, RBAC, i18n, and dark mode.

- **Main app**: port 80 (NGINX) → main_frontend (React/Vite)
- **Admin panel**: `/admin-panel` on the same host (NGINX) → admin_frontend (React/Vite)
- **Backend API**: port 3000 (internal, not exposed directly)
- **Swagger docs**: `http://localhost/api/docs`

## Architecture: Dual Network Isolation

```
Internet → NGINX (dmz_net)
              ├── main_frontend   (dmz_net)
              ├── admin_frontend  (dmz_net)
              └── /api/* → backend (internal_net)
                              ├── PostgreSQL  (internal_net)
                              └── email_service (internal_net)
```

- `dmz_net`: NGINX + frontends (internet-facing)
- `internal_net`: backend + postgres + email_service (isolated)
- NGINX is the only bridge between networks
- For production: set `internal: true` on `internal_net` in `docker-compose.prod.yml`, remove exposed ports (5432, 5555)

## Auth Flow (Critical)

Dual-token model. Both are required:

1. **Session cookie** (Better Auth) — set after `/api/auth/sign-in/email`
2. **JWT Bearer token** — obtained via `POST /api/auth/token` using the session cookie

Login sequence:
1. POST `/api/auth/sign-in/email` → sets session cookie, returns user
2. If `twoFactorRedirect: true` → navigate to `/auth/2fa-challenge`
3. If `emailOtpRequired: true` → navigate to `/auth/email-otp`
4. Otherwise → POST `/api/auth/token` → get JWT
5. All subsequent API calls use `Authorization: Bearer <jwt>`

The `AuthProvider` uses `flushSync` to commit user state before navigation — this prevents a React 18 concurrent-mode race where `user` is null on first render of Dashboard.

## Route Registration Order (backend/src/index.ts)

Order matters. Auth routes MUST be mounted BEFORE `jwtAuth` middleware:

```
1. /api/auth          ← public (session-based auth + token endpoint)
2. jwtAuth            ← applied to everything below
3. /api/counter       ← JWT-protected
4. adminAuth + /api/admin ← uses x-admin-secret header, not JWT
```

The public route skip list is hardcoded in `backend/src/middleware/jwtAuth.ts` in `PUBLIC_ROUTES`.

## RBAC: Opt-In Model

RBAC is opt-in. If NO `RoleEndpointMapping` rows exist for a path, any authenticated user can access it. Once a mapping exists, only users with a matching role get through. See `backend/src/lib/rbac.ts`.

## Env Loading

Backend loads `.env` from **two directories up** from `backend/src/`:
```
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
```
The `.env` file lives at the project root, not in `backend/`.

## Path Aliases (Different Between Frontends)

| Frontend | Alias | Resolves to |
|----------|-------|-------------|
| main_frontend | `@shared` | `../shared` |
| admin_frontend | `@shared` | `shared/` (relative to admin_frontend root) |

Both import from `shared/auth/` for AuthProvider, useAuth, authClient, types.

## i18n

- Only main_frontend has i18n (admin_frontend does not)
- Default/fallback language: **French** (`fr`)
- localStorage key: `grosbuschb2b-language`
- Locale files: `main_frontend/src/locales/{fr,en}/common.json`
- Config: `main_frontend/src/i18n/index.ts`

## Theme

Both frontends have separate `tailwind.config.js` and `ThemeProvider.tsx` — keep them in sync when changing tokens. Full token reference: `THEME.md`.

## Project Naming

The project name appears in these places. Keep them consistent when renaming:

| String | Where it appears |
|--------|-----------------|
| `GrosBuschB2B` | package.json names, page titles, Better Auth `appName` and TOTP `issuer` in `backend/src/lib/auth.ts`, Swagger title |
| `grosbuschb2b` | POSTGRES_DB, DATABASE_URL, docker-compose container names, localStorage keys (`grosbuschb2b_jwt_token`, `grosbuschb2b-theme`, `grosbuschb2b-language`) |
| `grosbuschb2b-documents` | MINIO_BUCKET and the matching nginx location block |
| `grosbuschb2b_auth` | Cookie prefix in `backend/src/lib/auth.ts` and `backend/src/routes/betterAuthProxy.ts` |

## Adding a New Route

1. Create `backend/src/routes/myFeature.ts`
2. Register in `backend/src/index.ts`: `app.use('/api/my-feature', myFeatureRouter)`
3. If JWT-protected: place AFTER `app.use(jwtAuth)` (default)
4. If public: add to `PUBLIC_ROUTES` in `middleware/jwtAuth.ts`
5. Add Swagger JSDoc annotations on the route file
6. Create frontend API service in `main_frontend/src/api/`

## Adding a New Page

1. Create `main_frontend/src/pages/MyPage.tsx`
2. Add route in `main_frontend/src/App.tsx`
3. Link from `DashboardHome.tsx`
4. Add translation keys to both `locales/en/common.json` and `locales/fr/common.json`

## Prisma

- Schema: `backend/prisma/schema.prisma`
- Binary targets include `windows` (local dev) and `linux-musl` (Alpine Docker) — do not remove either
- After schema changes: `npx prisma migrate dev --name <name>` then `npx prisma generate`
- Seed script creates auth settings + default roles (Admin User, Manager)

## Key Commands

```bash
# Docker (full stack)
docker compose up --build              # build and start all
docker compose up -d                   # detached
docker compose down                    # stop
docker compose down -v                 # stop + wipe DB volume
docker compose restart backend         # restart one service

# Database
docker compose exec backend npx prisma migrate dev --name <name>
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma studio
docker compose exec backend npm run seed

# Backend (local, without Docker)
cd backend && npm install && npm run dev

# Frontend (local)
cd main_frontend && npm install && npm run dev    # port 5173
cd admin_frontend && npm install && npm run dev   # http://localhost:5174/admin-panel
```

## No Test Framework

No test runner is configured. Do not assume Jest, Vitest, or any other framework exists.
