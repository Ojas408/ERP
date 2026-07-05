#!/bin/sh
set -e

echo "Applying database schema..."
TRIES=0
MAX_TRIES=30
until npx prisma db push --accept-data-loss; do
  TRIES=$((TRIES + 1))
  if [ "$TRIES" -ge "$MAX_TRIES" ]; then
    echo "Database connection failed after $MAX_TRIES attempts"
    exit 1
  fi
  echo "Database not ready — retry $TRIES/$MAX_TRIES..."
  sleep 3
done

if [ "$SEED_DB" = "true" ]; then
  echo "Seeding database (SEED_DB=true)..."
  npx tsx prisma/seed.ts
else
  echo "Skipping seed (set SEED_DB=true to load demo data)"
fi

echo "Starting API server..."
exec npm start
