# Construction ERP Backend

Node.js + Express + Prisma + PostgreSQL API for the Enterprise Construction ERP Dashboard.

## Setup

```bash
cd backend
npm install
cp .env.example .env   # if present, or create .env
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

Server: **http://localhost:5000**

## Default login

- **Email:** `admin@example.com`
- **Password:** `admin123`

See root `README.md` for all test users and Docker instructions.

## API overview

- `POST /auth/login` — Login
- `POST /auth/register` — Register + create workspace
- `GET /api/*` — ERP modules (JWT required)

Subscription/billing routes are disabled during testing.
