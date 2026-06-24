#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/design-ai}"
REPO_URL="${REPO_URL:-https://github.com/egmen1-dev/design-ai.git}"
BRANCH="${DEPLOY_BRANCH:-main}"
NODE_VERSION="${NODE_VERSION:-20}"

echo "==> Setting up VPS for design-ai"

export DEBIAN_FRONTEND=noninteractive

if ! command -v node &>/dev/null; then
  echo "==> Installing Node.js ${NODE_VERSION}"
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

if ! command -v pm2 &>/dev/null; then
  echo "==> Installing PM2"
  sudo npm install -g pm2
fi

if ! command -v psql &>/dev/null; then
  echo "==> Installing PostgreSQL"
  sudo apt-get update
  sudo apt-get install -y postgresql postgresql-contrib
fi

if ! command -v ollama &>/dev/null; then
  echo "==> Installing Ollama"
  curl -fsSL https://ollama.com/install.sh | sh
fi

echo "==> Pulling Ollama model qwen2.5:7b"
ollama pull qwen2.5:7b || true

echo "==> Installing Puppeteer dependencies"
sudo apt-get install -y \
  ca-certificates fonts-liberation libasound2t64 libatk-bridge2.0-0t64 \
  libatk1.0-0t64 libc6 libcairo2 libcups2t64 libdbus-1-3 libexpat1 \
  libfontconfig1 libgbm1 libgcc-s1 libglib2.0-0t64 libgtk-3-0t64 \
  libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 \
  libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 \
  libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 \
  lsb-release wget xdg-utils 2>/dev/null || \
sudo apt-get install -y \
  ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 \
  libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 \
  libfontconfig1 libgbm1 libgcc-s1 libglib2.0-0 libgtk-3-0 \
  libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 \
  libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 \
  libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 \
  lsb-release wget xdg-utils

if [ ! -d "${APP_DIR}/.git" ]; then
  echo "==> Cloning repository"
  sudo mkdir -p "${APP_DIR}"
  sudo chown "$(whoami):$(whoami)" "${APP_DIR}"
  git clone --branch "${BRANCH}" "${REPO_URL}" "${APP_DIR}"
else
  echo "==> Repository already exists at ${APP_DIR}"
fi

chmod +x "${APP_DIR}/scripts/deploy.sh"

if [ ! -f "${APP_DIR}/marketplace-infographic/.env" ]; then
  echo "==> Creating .env from example — edit with real secrets"
  cp "${APP_DIR}/marketplace-infographic/.env.example" \
    "${APP_DIR}/marketplace-infographic/.env"
fi

echo "==> Setting up PostgreSQL database"
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='designai'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER designai WITH PASSWORD 'changeme';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='marketplace_infographic'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE marketplace_infographic OWNER designai;"

pm2 startup systemd -u "$(whoami)" --hp "$HOME" 2>/dev/null || true

echo "==> VPS setup complete. Next steps:"
echo "  1. Edit ${APP_DIR}/marketplace-infographic/.env"
echo "  2. Run: cd ${APP_DIR} && bash scripts/deploy.sh"
echo "  3. Configure GitHub secrets: VPS_HOST, VPS_USER, VPS_SSH_KEY, APP_DIR"
