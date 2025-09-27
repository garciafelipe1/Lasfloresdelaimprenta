#!/bin/bash

# Este script inicia la medusa store desde 0
# - Levanta postgres usando docker compose (docker compose up/down)
# - Corre las migraciones de better auth (pnpm db:migrate)
# - Corre la generacion de membresias y usuarios de prueba (pnpm db:seed)
# - Corre las migraciones iniciales de medusa (pnpm medusa db:migrate)
# - Corre la generacion de información inicial y setea la region de Argentina (pnpm medusa db:seed)
# - Añade un usuario admin con las credenciales del .env de la raiz (pnpm medusa user -e <user> -p <password>)
# - Inicia el backend en http://localhost:9000/app

# Si se pasa la flag --run levanta el front y back

SHOULD_RUN_DEV=false
VERBOSE=false

# Parse arguments
for arg in "$@"; do
  case $arg in
    --run)
      SHOULD_RUN_DEV=true
      ;;
    --verbose)
      VERBOSE=true
      ;;
  esac
done

run_cmd() {
  if [ "$VERBOSE" = true ]; then
    echo "🔍 Running: $*"
    eval "$@"
  else
    eval "$@" > /dev/null 2>&1
  fi
}

# Load environment variables from .env file
set -a
source .env
set +a

# 🔐 Required environment variables
REQUIRED_VARS=("POSTGRES_USER" "POSTGRES_DB" "POSTGRES_PASSWORD" "MEDUSA_EMAIL" "MEDUSA_PASSWORD")

for var in "${REQUIRED_VARS[@]}"; do
  if [[ -z "${!var}" ]]; then
    echo "❌ Environment variable $var is not set. Please check your .env file."
    exit 1
  fi
done

# 🚨 Confirmation prompt
echo "⚠️  This script will DROP your database and recreate everything."
read -p "Are you sure you want to continue? (Y/n): " confirm
if [[ "$confirm" != "Y" && "$confirm" != "y" && "$confirm" != "" ]]; then
  echo "❌ Aborted by user."
  exit 1
fi

echo "🛠️ Setting up store..."

echo "🐘 Starting postgres service..."
run_cmd "docker compose down -v && docker compose up -d --build"

echo "Waiting for the database to become healthy..."
until [ "$(docker inspect -f '{{.State.Health.Status}}' floreria-db)" == "healthy" ]; do
  echo "⏱️ Database not ready yet. Waiting..."
  sleep 2
done

echo "✅ Database is ready!"

cd ./apps/www

echo "🔒 Running Better Auth migrations..."
run_cmd "pnpm db:migrate"

echo "🌱 Seed test users and memberships..."
run_cmd "pnpm db:seed"

cd ..

cd ./store

echo "🔒 Running DB migrations..."
run_cmd "pnpm medusa db:migrate"

echo "🌱 Seeding database..."
run_cmd "pnpm seed"

echo "👤 Creating admin user..."
run_cmd "pnpm medusa user -e \"$MEDUSA_EMAIL\" -p \"$MEDUSA_PASSWORD\""

cd ../..

if [ "$SHOULD_RUN_DEV" = true ]; then
  echo "Starting development servers from monorepo root..."
  pnpm dev
else
  echo "✅ Setup complete. Use '--run' to start development mode."
fi