# Construction ERP Backend

This is the backend for the Enterprise Construction ERP Dashboard.

## Tech Stack
- **Node.js** with **TypeScript**
- **Express.js** (Server)
- **Prisma** (ORM)
- **SQLite** (Database)

## Getting Started

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Set Up Database
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

### 3. Run the Server
```bash
npm run dev
```
The server will start on `http://localhost:5000`.

## API Endpoints

### Auth
- `POST /auth/login` - Login with email and password
- `POST /auth/register` - Register a new user

### ERP Data
- `GET /api/stats` - Get overall dashboard statistics
- `GET /api/production` - List production entries
- `POST /api/production` - Create new production entry
- `GET /api/inventory` - List inventory items
- `GET /api/expenses` - List expenses

## Default Credentials
- **Email**: `admin@example.com`
- **Password**: `admin123`
