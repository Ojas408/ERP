# Enterprise Construction ERP

Full-stack ERP for construction companies — production, inventory, payroll, sites, vehicles, purchase orders, material inward, overhead reports, and analytics.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite + TypeScript + Tailwind + shadcn/ui |
| Backend | Node.js + Express + Prisma |
| Database | PostgreSQL |
| Deploy | Docker Compose |

## Quick start — Docker (recommended)

```bash
cp .env.example .env    # edit passwords!
docker compose up --build -d
```

Open **http://localhost** → login `admin@example.com` / `admin123`

See **[HOSTING.md](HOSTING.md)** for full deployment guide.

## Quick start — local dev

```bash
docker compose up db -d

cd backend && npm install && npx prisma db push && npx tsx prisma/seed.ts && npm run dev
cd frontend && npm install && npm run dev
```

- API: http://localhost:5000  
- UI: http://localhost:5173  

## Modules (all API-integrated)

- Dashboard, Projects/Sites, Production, Consumption
- Material Inward (cement, aggregate, sand, steel)
- Inventory, Purchase Orders, Vendors
- Employees, Workers, Payroll, Attendance
- Equipment, Vehicles, Maintenance, Challans
- RMC Grades, Scrap Management
- Business Analytics, Efficiency, Target Achievement
- Accounts, Total Overhead Report (transit mixture, slabs, etc.)
- Master Data, Settings

## Test users (password: `admin123`)

`admin@`, `hr@`, `accounts@`, `purchase@`, `site@`, `manager@`, `viewer@` + `example.com`

## API

- `GET /health` — health check
- `POST /auth/login` — login
- `POST /auth/register` — register workspace
- `GET/POST /api/*` — ERP modules (JWT required)

## Notes

- Subscription/billing disabled for testing
- Set `SEED_DB=false` after first Docker deploy to preserve data
- Uploaded files stored in Docker volume `uploads`
