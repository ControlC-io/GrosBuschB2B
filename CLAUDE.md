# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**GrosBuschB2B** is a secure, multi-tier B2B and B2C webshop with network-isolated DMZ architecture. It consists of a user-facing React frontend, an admin React frontend, an Express/TypeScript backend, an isolated email microservice, PostgreSQL, and NGINX as the reverse proxy entry point.

---

## Development Commands

### Docker (recommended — runs all services together)

```bash
docker-compose up --build          # Build and start all services
docker-compose up -d               # Start detached
docker-compose down                # Stop and remove containers
docker-compose up -d --force-recreate backend email_service  # Restart specific services after .env changes
```

### Backend (`backend/`)

```bash
npm run dev                # Start with ts-node-dev (watch mode)
npm run build              # Compile TypeScript to dist/
npm start                  # Run compiled dist/index.js

npm run prisma:generate    # Regenerate Prisma client after schema changes
npm run prisma:migrate     # Create and apply a new migration
npm run prisma:push        # Push schema without migration (dev shortcut)
npm run prisma:studio      # Open Prisma Studio GUI (port 5555)
npm run seed               # Seed auth config and system settings
npm run test:auth          # View DB users and sessions (smoke test)
```

### Main Frontend (`main_frontend/`)

```bash
npm run dev       # Vite dev server on port 5173
npm run build     # tsc + vite build
npm run lint      # ESLint with zero-warnings policy
```

### Admin Frontend (`admin_frontend/`)

```bash
npm run dev       # Vite dev server on port 5174
npm run build     # tsc + vite build
npm run lint      # ESLint with zero-warnings policy
```

### Email Service (`email_service/`)

```bash
npm run dev       # ts-node-dev watch mode
npm run build     # Compile to dist/
```

No test framework is configured in this project.

---

## Architecture

### Network Topology

Two isolated Docker networks enforce the DMZ boundary:

| Network | Services | Internet-accessible |
|---|---|---|
| `dmz_net` | NGINX, main_frontend, admin_frontend | Yes (via NGINX) |
| `internal_net` | backend, postgres, email_service | No |

NGINX (ports 80 and 8080) is the sole entry point. All `/api` traffic is proxied to the backend; frontends are never exposed directly. In development, `internal_net` has `internal: false` to allow host-machine access (e.g., Prisma Studio). Set `internal: true` for production.

### Authentication Flow (dual-token model)

Better Auth handles **session-based** auth (cookies), while the API uses **JWT Bearer tokens**:

1. User logs in via Better Auth → receives a session cookie.
2. Frontend calls `POST /api/auth/token` with the session cookie → receives a short-lived JWT (default 8h).
3. All subsequent API calls use `Authorization: Bearer <jwt>`.
4. 2FA is enforced before the JWT is issued — TOTP (via Better Auth TOTP plugin) or Email OTP (via the email microservice).

The `jwtAuth` middleware (`backend/src/middleware/jwtAuth.ts`) enforces this on all routes except a hardcoded public allowlist (auth, health, admin).

### RBAC (opt-in model)

Roles are stored in `Role` + `UserRole` tables. Access is controlled through `RoleEndpointMapping` rows that pair a role to an `(endpoint, method)`. The key behavior: **if no mapping exists for a path, all authenticated users are allowed**. Once a mapping is added, only users with that role can access it. `hasRoleAccess()` in `backend/src/lib/rbac.ts` implements this with support for method wildcards (`*`) and path prefix matching.

### Dynamic Auth Configuration

`SystemSettings` table (managed through the admin frontend) drives runtime auth behavior — feature flags like enabling/disabling 2FA, OAuth providers, etc. These are loaded in `backend/src/lib/auth.ts` at startup and can be reloaded without redeployment.

### Email Service

A standalone Express microservice (`email_service/`) that wraps the SendGrid API. The backend communicates with it over `internal_net` using a shared `EMAIL_SERVICE_SECRET`. It is completely isolated from the internet — only the backend can call it.

### Path Aliases

Both frontends define `@shared/*` pointing to the top-level `shared/` directory:
- `main_frontend`: `../shared/*`
- `admin_frontend`: `shared/` (note the different relative path)

`shared/auth/` contains the Better Auth client, AuthProvider, and shared types used by both frontends.

---

## Key Constraints (from `.cursorrules`)

- **Strict TypeScript** throughout — no `any`, no implicit types.
- **Functional programming preferred** — `const` over `let`, pure functions where practical.
- **Always use try-catch** for async operations.
- **Configuration from env vars or `SystemSettings`** — never hardcode secrets or URLs.
- **No hyphens in generated documentation text** — use spaces or underscores.
- **English only** for all code, comments, and user-facing strings (i18n keys are fine).

---

## Environment Setup

Copy `.env.example` to `.env`. Key variables:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection (use service name `postgres` inside Docker) |
| `JWT_SECRET` | Must be a long random string in production |
| `BETTER_AUTH_SECRET` | Better Auth encryption key |
| `BETTER_AUTH_URL` | Public base URL of the app |
| `TRUSTED_ORIGINS` | Comma-separated CORS-allowed origins |
| `ADMIN_SECRET` | Shared secret for admin API routes (`x-admin-secret` header) |
| `EMAIL_SERVICE_SECRET` | Shared secret between backend and email_service |
| `SENDGRID_API_KEY` | SendGrid API key for email delivery |
| `VITE_API_BASE_URL` | External accounting/tickets API base URL (frontend) |

After changing `.env`, restart affected services: `docker-compose up -d --force-recreate backend email_service`.

---

## Swagger / API Docs

Available at `http://localhost/api/docs` (via NGINX on port 80) or `http://localhost:3000/api/docs` (direct backend in dev). Swagger spec is built dynamically in `backend/src/lib/swagger.ts` from JSDoc annotations on route files.

---

## Prisma Schema Notes

Binary targets include `windows`, `linux-musl`, and `linux-musl-arm64-openssl-3.0.x` to support both local Windows development and Alpine-based Docker containers. Always run `npm run prisma:generate` after any schema change before building or running the backend.
