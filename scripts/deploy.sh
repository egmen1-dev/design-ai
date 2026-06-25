#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/design-ai}"
APP_NAME="marketplace-infographic"
BRANCH="${DEPLOY_BRANCH:-main}"

echo "==> Deploying design-ai from branch ${BRANCH}"

cd "${APP_DIR}"

if [ -d .git ]; then
  git fetch origin "${BRANCH}"
  git checkout "${BRANCH}"
  git reset --hard "origin/${BRANCH}"
  echo "==> Checked out commit $(git rev-parse --short HEAD)"
else
  echo "ERROR: ${APP_DIR} is not a git repository. Run setup-vps.sh first."
  exit 1
fi

cd "${APP_DIR}/${APP_NAME}"

echo "==> Stopping existing PM2 process before build"
pm2 delete marketplace-infographic 2>/dev/null || true

echo "==> Removing previous Next.js build"
rm -rf .next node_modules

echo "==> Installing dependencies"
npm ci

echo "==> Generating Prisma client"
npx prisma generate

echo "==> Running database migrations"
npx prisma migrate deploy

echo "==> Building Next.js app"
npm run build

echo "==> Restarting PM2 process"
cd "${APP_DIR}"
pm2 start ecosystem.config.cjs --update-env

pm2 save
pm2 status marketplace-infographic

echo "==> Verifying local app routes"
sleep 3
curl -fsS http://127.0.0.1:3000/register | grep -q "Регистрация"

echo "==> Deploy complete"
