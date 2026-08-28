# Deploying GrosBuschB2B to Coolify

Step by step guide to deploy this project on [Coolify](https://coolify.io) using Docker Compose. Based on the same patterns used in the lawyer-app Coolify setup.

---

## Stack overview

| Service | Role | Exposed to internet |
|---|---|---|
| `nginx` | Reverse proxy entry point (DMZ) | Yes (via Coolify/Traefik) |
| `main_frontend` | React user app (static build) | No (only via nginx) |
| `admin_frontend` | React admin panel (static build) | No (only via nginx) |
| `backend` | Express API + Better Auth + Prisma | No (only via nginx `/api`) |
| `email_service` | SendGrid microservice (2FA OTP) | No (internal only) |
| `postgres` | PostgreSQL 16 | No (internal only) |

**Local dev** uses `docker-compose.dev.yml` (loaded by `docker-compose.yml`; Vite dev servers, volume mounts, exposed ports).

**Production on Coolify** uses `docker-compose.prod.yml` (compiled images, no repo mounts, Traefik handles SSL).

---

## Prerequisites

### 1. Server requirements

| Resource | Minimum | Recommended |
|---|---|---|
| RAM | 2 GB free | 4 GB total server |
| CPU | 2 vCPU | 2+ vCPU |
| Disk | 10 GB | 20 GB |

This compose file budgets roughly **1.5 GB** for all services (see memory limits in `docker-compose.prod.yml`).

### 2. Commit Prisma migrations

Coolify runs `prisma migrate deploy` on backend startup. Migrations **must exist in the repo**.

Before the first deploy, run locally:

```bash
docker compose up -d postgres
docker compose exec backend npx prisma migrate dev --name init
```

Then commit `backend/prisma/migrations/`. If `.gitignore` blocks that folder, remove the `backend/prisma/migrations/` entry from `.gitignore` first.

### 3. One domain

| URL | Purpose |
|---|---|
| `https://app.yourdomain.com` | Main user application |
| `https://app.yourdomain.com/admin-panel` | Admin panel |

Both the shop and the admin panel are served by the **same** `nginx` service on one hostname. NGINX routes `/admin-panel/` to `admin_frontend` and everything else to `main_frontend`.

### 4. SendGrid (for email OTP 2FA)

If you use email OTP, configure a verified sender in SendGrid and set `SENDGRID_API_KEY` + `SENDGRID_FROM_EMAIL`.

---

## Step 1 — Prepare production environment file

1. Copy `.env.production.sample` to a local file `.env.prod` (gitignored).
2. Replace every `CHANGE_ME` value with real secrets.

Generate random secrets:

```bash
openssl rand -hex 32   # JWT_SECRET, BETTER_AUTH_SECRET
openssl rand -hex 24   # ADMIN_SECRET, EMAIL_SERVICE_SECRET
```

### Critical variable rules

| Variable | Rule |
|---|---|
| `BETTER_AUTH_URL` | Full app URL with `https://`, e.g. `https://app.yourdomain.com` |
| `TRUSTED_ORIGINS` | The same origin as the app (shop and admin share the host) |
| `DATABASE_URL` | Use Docker service name: `@postgres:5432` |
| `EMAIL_SERVICE_URL` | Internal URL: `http://email_service:3001` |
| `VITE_API_URL` | **Leave empty** — frontends use same origin `/api` paths |
| `VITE_ADMIN_SECRET` | Must match `ADMIN_SECRET` exactly (baked into admin SPA at build time) |
| `NODE_ENV` | `production` — mark as **Runtime only** in Coolify (see gotchas below) |
| `MAIN_APP_DOMAIN` | Hostname only, no protocol: `app.yourdomain.com` |
| `EXTERNAL_API_UPSTREAM` | Optional `host:port` for `/external-api` proxy (no `http://`) |

> **`VITE_API_URL` must be empty.** Vite bakes env vars at build time. Any non empty value gets hardcoded into the JS bundle and the browser will call that URL directly instead of using nginx relative paths.

> **`VITE_ADMIN_SECRET` is build time.** Changing it in Coolify requires a full redeploy so the admin frontend image rebuilds.

---

## Step 2 — Create the Coolify application

1. In Coolify: **New Resource → Docker Compose**
2. Connect your Git repository
3. Set **Docker Compose Location** to `/docker-compose.prod.yml`
4. Assign the app domain to the `nginx` service:
   - `https://app.yourdomain.com`
5. Confirm the exposed port is **80**

Coolify/Traefik terminates SSL upstream. The internal nginx config is HTTP only.

---

## Step 3 — Set environment variables

In Coolify → **Environment Variables → Production**, paste the contents of `.env.prod`.

| Coolify setting | Value |
|---|---|
| `NODE_ENV` | Mark as **Runtime only** (not available at build time) |
| `VITE_*` variables | Available at build time (default Coolify behavior) |

Do not configure Preview Deployment variables unless you use preview environments.

---

## Step 4 — DNS

Create an A record (or CNAME) pointing the app domain to your Coolify server IP:

```
app.yourdomain.com    →  YOUR_SERVER_IP
```

Propagation can take a few minutes.

---

## Step 5 — Deploy

Click **Deploy** in Coolify.

Expected build time: ~4 min (warm cache), ~8 min (cold).

What happens internally:

1. Coolify clones the repo into a temporary build directory
2. Docker BuildKit builds all images (repo files are available here)
3. Coolify runs `docker compose up -d` from its **persistent app directory** (repo files are NOT available here — config must be baked into images, not volume mounted)
4. Backend waits for Postgres, runs `prisma migrate deploy`, then starts Express

---

## Step 6 — Bootstrap the database (first deploy only)

The database starts empty after the first deploy.

### 6a. Seed system settings and roles (optional)

The production backend image does not include the TypeScript seed script. Options:

1. **Recommended:** after registering your first user, configure auth and RBAC from the admin panel Settings tab.
2. **Dev compose:** run `docker compose exec backend npm run seed` locally against a copy of the production database (advanced).

### 6b. Create the first user

1. Open `https://app.yourdomain.com/register`
2. Create an account (email + password)
3. Complete 2FA setup if enabled in system settings
4. Log in and verify `/api/health` returns `ok`

### 6c. Access the admin panel

1. Open `https://app.yourdomain.com/admin-panel`
2. The admin panel uses `VITE_ADMIN_SECRET` (set at build time) to call `/api/admin/*`
3. Configure auth providers, 2FA, and RBAC from the Settings tab

---

## Step 7 — Verify

| Check | URL / command |
|---|---|
| Main app loads | `https://app.yourdomain.com` |
| Admin panel loads | `https://app.yourdomain.com/admin-panel` |
| API health | `curl https://app.yourdomain.com/api/health` |
| Swagger docs | `https://app.yourdomain.com/api/docs` |
| Auth session | Register + login flow on main app |
| Admin API | Settings tab loads without 401 |

---

## Redeploying

| Change type | Action |
|---|---|
| Code change | Push to main → Coolify auto deploys (if webhook configured) or click Redeploy |
| Backend runtime env var | Redeploy — containers restart with new values |
| `VITE_*` env var | Redeploy — frontend images must rebuild |
| `VITE_ADMIN_SECRET` or `ADMIN_SECRET` | Redeploy admin frontend + ensure both values still match |
| New DB migration | Commit migration → push → redeploy (`migrate deploy` runs on startup) |
| `BETTER_AUTH_URL` / `TRUSTED_ORIGINS` | Redeploy backend |

---

## Architecture on Coolify

```
Internet
   │
   ▼
Coolify Traefik (SSL, ports 80/443)
   │
   ▼
nginx (dmz_net + internal_net bridge)
   ├── /              → main_frontend:80  (static SPA)
   ├── /admin-panel/  → admin_frontend:80 (static SPA)
   ├── /api           → backend:3000
   └── /external-api  → upstream (optional)

internal_net (isolated):
   backend ↔ postgres
   backend ↔ email_service
```

The DMZ pattern is preserved: only `nginx` bridges `dmz_net` and `internal_net`. Backend and database are not directly reachable from the internet.

---

## Common Coolify gotchas

| Problem | Cause | Fix |
|---|---|---|
| Build hangs 1+ hour | npm cache mount shared between parallel builds | Each Dockerfile uses a unique cache `id=` (already configured) |
| nginx fails: "not a directory" | Volume mount of a repo file in compose | Use `docker-compose.prod.yml` — nginx config is COPY'd into the image |
| Port 80 already allocated | Traefik owns host port 80 | No `ports:` on nginx; only `expose: - "80"` |
| 404 after successful deploy | Traefik has no route | Set the app domain on the `nginx` service in Coolify |
| Frontend calls `http://127.0.0.1:3000` | `VITE_API_URL` was non empty at build time | Set `VITE_API_URL=` (empty) and redeploy |
| Admin panel 401 on all tabs | `VITE_ADMIN_SECRET` ≠ `ADMIN_SECRET` | Set both to the same value and redeploy |
| Login fails after redeploy | DB volume recreated or `JWT_SECRET` changed | Users must re register; secrets must stay stable |
| TypeScript build fails | `NODE_ENV=production` at build time skips devDependencies | Mark `NODE_ENV` as Runtime only in Coolify |
| `.mjs` module script MIME error | nginx default mime.types missing `.mjs` | `nginx/spa.conf` already handles this |
| Migration error on startup | No `prisma/migrations` in repo | Run `prisma migrate dev` locally and commit migrations |
| Better Auth cookie issues | Wrong `BETTER_AUTH_URL` or missing origin in `TRUSTED_ORIGINS` | Set both to exact production URLs with `https://` |
| Email OTP not sent | SendGrid key invalid or sender not verified | Check SendGrid dashboard and `SENDGRID_FROM_EMAIL` |

---

## Optional: external accounting API

If you use the `/external-api` proxy (see `main_frontend/vite.config.ts`):

1. Set `VITE_API_BASE_URL` to the upstream API URL (used by the frontend build for reference)
2. Set `EXTERNAL_API_UPSTREAM` to `host:port` only (e.g. `api.example.com:443` or `152.228.162.63:3234`)
3. Redeploy

If you do not use this feature, leave both empty. The `/external-api` location will not work but the rest of the app is unaffected.

---

## Security checklist (production)

- [ ] `JWT_SECRET` — random 32 byte hex (`openssl rand -hex 32`)
- [ ] `BETTER_AUTH_SECRET` — random 32 byte hex
- [ ] `ADMIN_SECRET` — strong secret, matches `VITE_ADMIN_SECRET`
- [ ] `EMAIL_SERVICE_SECRET` — strong secret, shared only between backend and email_service
- [ ] `POSTGRES_PASSWORD` — strong password, not the default
- [ ] `TRUSTED_ORIGINS` — only your real production origin
- [ ] OAuth redirect URIs updated in Google/GitHub consoles if used
- [ ] Postgres port **not** exposed on the host (already the case in prod compose)
- [ ] `internal_net: internal: true` enabled in `docker-compose.prod.yml`

---

## Related files

| File | Purpose |
|---|---|
| `docker-compose.prod.yml` | Production compose for Coolify |
| `docker-compose.dev.yml` | Local development stack |
| `docker-compose.yml` | Includes the dev compose so `docker compose up` works |
| `.env.production.sample` | Production env template |
| `nginx/nginx.prod.conf` | HTTP reverse proxy (shop + `/admin-panel`) |
| `nginx/admin-spa.conf` | Static SPA config for the admin image |
| `nginx/Dockerfile` | nginx image with baked config |
| `backend/Dockerfile.prod` | Compiled backend + auto migrations |
| `main_frontend/Dockerfile.prod` | Vite build → nginx static |
| `admin_frontend/Dockerfile.prod` | Vite build → nginx static under `/admin-panel` |
| `email_service/Dockerfile.prod` | Compiled email microservice |
| `backend/scripts/migrate.js` | Waits for DB, runs `prisma migrate deploy` |

For local development deployment notes, see [deployment.md](deployment.md).
