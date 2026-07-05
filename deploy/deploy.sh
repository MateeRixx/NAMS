#!/bin/bash
set -euo pipefail

# ========================================
# NewsFlow — Deploy Update Script
# Pulls latest code and rebuilds backend
# ========================================

cd "$(dirname "$0")/.."

echo "=== Pulling latest code ==="
git pull

echo "=== Rebuilding and restarting ==="
docker compose -f docker-compose.prod.yml up -d --build backend

echo "=== Running database migrations ==="
docker compose -f docker-compose.prod.yml exec -T backend npx prisma db push --accept-data-loss 2>/dev/null || true

echo "=== Cleaning up old images ==="
docker image prune -f

echo "=== Deploy complete ==="
docker compose -f docker-compose.prod.yml ps
