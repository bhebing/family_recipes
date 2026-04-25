#!/bin/sh
set -e

# Build DATABASE_URL from individual RDS secret fields injected by ECS
if [ -z "$DATABASE_URL" ] && [ -n "$DB_HOST" ]; then
  DB_PASSWORD_ENCODED=$(node -e "process.stdout.write(encodeURIComponent(process.env.DB_PASSWORD))")
  export DATABASE_URL="postgresql://${DB_USERNAME}:${DB_PASSWORD_ENCODED}@${DB_HOST}:5432/${DB_NAME}?schema=public"
fi

echo "Running database migrations..."
node_modules/.bin/prisma migrate deploy

echo "Starting application..."
exec node server.js
