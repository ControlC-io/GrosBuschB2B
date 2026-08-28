# GrosBuschB2B

B2B and B2C webshop: React + Express + PostgreSQL + NGINX in a DMZ architecture, with auth, 2FA, RBAC, dark mode, and i18n built in.

## Stack

| | |
|-|-|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Express.js, TypeScript, Prisma ORM |
| Auth | Better Auth — sessions, JWT, TOTP 2FA, email OTP |
| Database | PostgreSQL 16 |
| Infra | Docker Compose, NGINX reverse proxy |
| Email | SendGrid (2FA OTP) |

## Quick Start

```bash
cp .env.example .env          # fill in secrets
docker compose up --build     # start everything

# first run only
docker compose exec backend npx prisma migrate dev --name init
docker compose exec backend npm run seed   # optional test user
```

| URL | Service |
|-----|---------|
| http://localhost | Main app |
| http://localhost/admin-panel | Admin panel |
| http://localhost/api/docs | Swagger |
| http://localhost:5555 | Prisma Studio |

## Deployment (Coolify)

Production deploys use `docker-compose.prod.yml` on [Coolify](https://coolify.io).

See **[docs/coolify-deployment.md](docs/coolify-deployment.md)** for the full guide (domain, env vars, first deploy bootstrap, gotchas).

Quick reference: copy `.env.production.sample`, set secrets, point Coolify to `/docker-compose.prod.yml`, assign the app domain to the `nginx` service.

## Project Structure

```
backend/          Express API — auth, RBAC, routes
main_frontend/    React user app
admin_frontend/   React admin panel
email_service/    SendGrid microservice (internal)
shared/auth/      Auth context used by both frontends
nginx/            Reverse proxy config
```

## How to Customise

**Rename the app** — search-replace `GrosBuschB2B` / `grosbuschb2b` in:
`index.html`, `package.json`, `.env`, `docker-compose.yml`,
`shared/auth/AuthProvider.tsx` (`JWT_STORAGE_KEY`),
`src/i18n/index.ts` (`STORAGE_KEY`), locale files.

**Change the theme** — edit color tokens in `tailwind.config.js` (both frontends). See `THEME.md`.

**Add a page**
1. Create `src/pages/MyPage.tsx`
2. Add `<Route path="/my-page" element={<MyPage />} />` in `App.tsx`
3. Link it in `DashboardHome.tsx`
4. Add a translation key to `locales/en/common.json` (and `fr/`)

**Add a backend route**
1. Create `backend/src/routes/myFeature.ts`
2. Register: `app.use('/api/my-feature', jwtAuth, myFeatureRouter)` in `index.ts`
3. Add a service in `main_frontend/src/api/myFeatureService.ts`

**Add a language** — add a locale folder, import in `i18n/index.ts`, add to `LanguagePicker.tsx`.

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `POSTGRES_*` | Database credentials |
| `DATABASE_URL` | Prisma connection string |
| `ADMIN_SECRET` | Admin API secret |
| `JWT_SECRET` | JWT signing secret |
| `BETTER_AUTH_SECRET` | Session encryption secret |
| `BETTER_AUTH_URL` | Backend public URL |
| `TRUSTED_ORIGINS` | Allowed CORS origins |
| `SENDGRID_API_KEY` | SendGrid for email OTP |
| `SENDGRID_FROM_EMAIL` | Verified sender address |
| `EMAIL_SERVICE_SECRET` | Internal email service secret |
| `VITE_API_BASE_URL` | Optional external API |

## Docker Commands

### Build

```bash
# Build and start all services (first time or after code changes)
docker compose up --build

# Build a single service only
docker compose build backend
docker compose build main_frontend
docker compose build admin_frontend

# Build without cache (full rebuild)
docker compose build --no-cache
```

### Start / Stop

```bash
docker compose up               # start in foreground (Ctrl+C to stop)
docker compose up -d            # start in background (detached)
docker compose down             # stop and remove containers
docker compose down -v          # also delete volumes (wipes the database)
docker compose restart backend  # restart a single service
```

### Logs

```bash
docker compose logs -f              # all services
docker compose logs -f backend      # backend only
docker compose logs -f main_frontend nginx  # multiple services
```

### Database

```bash
# Run migration (creates/updates tables)
docker compose exec backend npx prisma migrate dev --name <migration_name>

# Apply migrations without creating a new one (production-style)
docker compose exec backend npx prisma migrate deploy

# Open Prisma Studio (visual DB editor)
docker compose exec backend npx prisma studio

# Seed the database with test data
docker compose exec backend npm run seed

# Reset the database (drops all data, re-runs migrations and seed)
docker compose exec backend npx prisma migrate reset
```

### Development (without Docker)

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend (user app)
cd main_frontend && npm install && npm run dev   # http://localhost:5173

# Frontend (admin)
cd admin_frontend && npm install && npm run dev  # http://localhost:5174/admin-panel
```

## Architecture

```
Internet → NGINX (DMZ)
             ├── main_frontend  (React)
             ├── admin_frontend (React, /admin-panel)
             └── /api/* → backend (internal network)
                            ├── PostgreSQL
                            └── email_service
```

DMZ and internal networks are isolated. NGINX is the only bridge.
For production: set `internal: true` on `internal_net` in `docker-compose.prod.yml`
and remove the `5432` / `5555` port mappings.
