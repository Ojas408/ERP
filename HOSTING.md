# Hosting Guide — Construction ERP

Deploy the full stack (PostgreSQL + API + React UI) with Docker.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- Ports **80**, **5000**, and **5432** available (or change in `.env`)

## Quick deploy (production)

```bash
# 1. Clone / open project
cd ERP

# 2. Create environment file
cp .env.example .env
# Edit .env — change POSTGRES_PASSWORD and JWT_SECRET!

# 3. Build and start
docker compose up --build -d

# 4. Open app
# http://localhost
```

**First run:** `SEED_DB=true` loads demo data (admin user, sites, production, etc.).

**After first run:** set `SEED_DB=false` in `.env` and restart to avoid wiping data on every deploy:

```bash
docker compose down
# edit .env: SEED_DB=false
docker compose up -d
```

## Default login

| Email | Password |
|-------|----------|
| admin@example.com | admin123 |

## Architecture

```
Browser → nginx (frontend:80)
            ├── /          → React SPA
            ├── /api/*     → backend:5000
            ├── /auth/*    → backend:5000
            └── /uploads/* → backend:5000

backend → PostgreSQL (db:5432)
```

## Health checks

| URL | Purpose |
|-----|---------|
| `http://localhost/health` | API + DB status (via nginx) |
| `http://localhost:5000/health` | Direct API health |

## Environment variables

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_PASSWORD` | Database password | `password123` |
| `JWT_SECRET` | Auth token secret | **must change** |
| `SEED_DB` | Load demo data on start | `true` (first deploy) |
| `NODE_ENV` | `production` in Docker | `production` |
| `CORS_ORIGIN` | Allowed origins (`*` = all) | `*` |
| `HTTP_PORT` | Web UI port | `80` |
| `API_PORT` | Direct API port | `5000` |

## Volumes (persistent data)

- `pgdata` — PostgreSQL database
- `uploads` — uploaded documents (employee/vehicle/challan files)

## Local development (without Docker UI)

```bash
# Terminal 1 — database
docker compose up db -d

# Terminal 2 — backend
cd backend
cp .env.example .env
npm install
npx prisma db push
npx tsx prisma/seed.ts
npm run dev

# Terminal 3 — frontend
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

## Cloud / VPS hosting

1. Copy project to server (Ubuntu recommended)
2. Install Docker + Docker Compose
3. Copy `.env.example` → `.env`, set strong passwords
4. Set `SEED_DB=true` once, then `false`
5. Run `docker compose up --build -d`
6. Point domain DNS to server IP
7. (Recommended) Put Caddy or Nginx reverse proxy with HTTPS in front of port 80

## Troubleshooting

**Blank page / API errors**
- Check backend: `docker compose logs backend`
- Check health: `curl http://localhost:5000/health`

**Database connection failed**
- Wait 30s for Postgres to start: `docker compose ps`
- Verify `DATABASE_URL` in backend logs

**Login fails**
- Re-seed once: set `SEED_DB=true`, `docker compose up -d --force-recreate backend`

**Port 80 in use**
- Change `HTTP_PORT=8080` in `.env`, access `http://localhost:8080`
