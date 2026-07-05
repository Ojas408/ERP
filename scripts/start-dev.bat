@echo off
echo Starting Construction ERP (local dev)...
echo.

echo [1/3] Starting PostgreSQL...
docker compose up db -d
timeout /t 5 /nobreak >nul

echo [2/3] Starting backend...
start "ERP Backend" cmd /k "cd /d %~dp0backend && npm run dev"

echo [3/3] Starting frontend...
start "ERP Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ERP starting...
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:5000
echo   Login:    admin@example.com / admin123
echo.
echo Run backend seed once if DB is empty:
echo   cd backend && npx prisma db push && npx tsx prisma/seed.ts
