# Deployment Guide

GrosBuschB2B can be deployed to production using **Coolify** and `docker-compose.coolify.yml`.

For the complete step by step Coolify guide, see [coolify-deployment.md](coolify-deployment.md).

---

## Local development

### Full Docker stack

```bash
cp .env.example .env
docker compose up --build

# first run only
docker compose exec backend npx prisma migrate dev --name init
docker compose exec backend npm run seed
```

| URL | Service |
|---|---|
| http://localhost | Main app |
| http://localhost:8080 | Admin panel |
| http://localhost/api/docs | Swagger |
| http://localhost:5555 | Prisma Studio (dev only) |

### Host dev (faster HMR)

Run only infrastructure in Docker and start frontends on the host:

```bash
docker compose up -d postgres email_service backend nginx
cd main_frontend && npm run dev
cd admin_frontend && npm run dev
```

---

## Production (Coolify)

See [coolify-deployment.md](coolify-deployment.md) for:

- Creating the Coolify application
- Environment variables (use `.env.production.sample` as reference)
- DNS and dual domain setup (main app + admin panel)
- First deploy database bootstrap
- Common Coolify gotchas

---

## Database

### Migrations

Migrations run automatically on backend startup in production via `backend/scripts/migrate.js`:

1. Waits for Postgres to be ready
2. Runs `prisma generate`
3. Runs `prisma migrate deploy`

To author a new migration locally:

```bash
docker compose exec backend npx prisma migrate dev --name your_migration_name
```

Commit the new files under `backend/prisma/migrations/` before deploying.

### Seed

Seed auth settings and default RBAC roles:

```bash
docker compose exec backend npm run seed
```

### Backup / restore

```bash
# Backup
docker compose exec postgres pg_dump -U postgres grosbuschb2b > backup.sql

# Restore
docker compose exec -T postgres psql -U postgres grosbuschb2b < backup.sql
```

---

## Health checks

```bash
curl http://localhost/api/health
curl http://localhost/api
```

Expected health response:

```json
{
  "status": "ok",
  "services": {
    "api": { "ok": true },
    "database": { "ok": true }
  }
}
```

---

## Security checklist (production)

- [ ] `JWT_SECRET` — random 32 byte hex
- [ ] `BETTER_AUTH_SECRET` — random 32 byte hex
- [ ] `ADMIN_SECRET` — strong secret
- [ ] `EMAIL_SERVICE_SECRET` — strong secret
- [ ] `POSTGRES_PASSWORD` — not the default
- [ ] `TRUSTED_ORIGINS` — production domains only
- [ ] `internal_net: internal: true` in production compose
- [ ] No Postgres or backend ports exposed on the host
