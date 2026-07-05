#!/bin/bash
set -euo pipefail

# ========================================
# NewsFlow — One-time EC2 Setup Script
# Run this on a fresh Ubuntu 22.04 EC2
# ========================================

echo "=== Updating system packages ==="
sudo apt-get update -y
sudo apt-get upgrade -y

echo "=== Installing Docker ==="
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  sudo usermod -aG docker "$USER"
  rm get-docker.sh
  echo "Docker installed. You may need to log out and back in for group changes."
else
  echo "Docker already installed."
fi

echo "=== Installing Docker Compose ==="
if ! command -v docker-compose &>/dev/null && ! docker compose version &>/dev/null; then
  sudo apt-get install -y docker-compose-plugin
fi

echo "=== Cloning repository ==="
if [ ! -d "NAMS" ]; then
  git clone https://github.com/MateeRixx/NAMS.git
  cd NAMS
else
  cd NAMS
  git pull
fi

echo ""
echo "============================================"
echo "  SETUP COMPLETE — Next steps:"
echo "============================================"
echo ""
echo "1. Create your .env file:"
echo "   cp .env.production.example .env"
echo "   nano .env    # fill in all secrets"
echo ""
echo "2. Start all services:"
echo "   docker compose -f docker-compose.prod.yml up -d"
echo ""
echo "3. Run database migrations:"
echo "   docker compose -f docker-compose.prod.yml exec backend \\"
echo "     npx prisma db push"
echo ""
echo "4. Seed initial data (optional):"
echo "   docker compose -f docker-compose.prod.yml exec backend \\"
echo "     npx tsx apps/backend/prisma/seed.ts"
echo ""
echo "5. Check logs:"
echo "   docker compose -f docker-compose.prod.yml logs -f"
echo ""
echo "Your API will be available at http://$(curl -s http://checkip.amazonaws.com):80"
echo "============================================"
