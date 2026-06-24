#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/design-ai}"
APP_NAME="marketplace-infographic"
BRANCH="${DEPLOY_BRANCH:-main}"

echo "==> Deploying design-ai from branch ${BRANCH}"

cd "${APP_DIR}"

if [ -d .git ]; then
  git fetch origin
  git checkout "${BRANCH}"
  git pull origin "${BRANCH}"
else
  echo "ERROR: ${APP_DIR} is not a git repository. Run setup-vps.sh first."
  exit 1
fi

cd "${APP_DIR}/${APP_NAME}"

echo "==> Installing dependencies"
npm ci

echo "==> Generating Prisma client"
npx prisma generate

echo "==> Running database migrations"
npx prisma migrate deploy 2>/dev/null || npx prisma db push

echo "==> Building Next.js app"
npm run build

echo "==> Restarting PM2 process"
cd "${APP_DIR}"
pm2 reload ecosystem.config.cjs --update-env || pm2 start ecosystem.config.cjs

pm2 save

echo "==> Deploy complete"
