#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/design-ai}"
APP_NAME="marketplace-infographic"
BRANCH="${DEPLOY_BRANCH:-main}"

echo "==> Deploying design-ai from branch ${BRANCH}"

cd "${APP_DIR}"

if [ -d .git ]; then
  git config --global --add safe.directory "${APP_DIR}" || true
  git fetch origin "${BRANCH}"
  git checkout "${BRANCH}"
  git reset --hard "origin/${BRANCH}"
  git clean -ffdx \
    -e marketplace-infographic/.env \
    -e marketplace-infographic/.env.local \
    -e marketplace-infographic/public/generated \
    -e "marketplace-infographic/public/generated/*"
  rm -rf "${APP_DIR}/${APP_NAME}/src/app/admin"
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
npm cache clean --force
npm ci --prefer-online --no-audit

if ! node -e "require.resolve('next/dist/server/config-schema'); require.resolve('next/dist/export')" >/dev/null 2>&1; then
  echo "==> Next.js package looks incomplete; reinstalling dependencies"
  npm cache clean --force
  NEXT_VERSION="$(node -p "require('./package-lock.json').packages['node_modules/next'].version")"
  rm -rf node_modules/next
  npm install --no-save --prefer-online --no-audit "next@${NEXT_VERSION}"
  node -e "require.resolve('next/dist/server/config-schema'); require.resolve('next/dist/export')"
fi

echo "==> Generating Prisma client"
npx prisma generate

echo "==> Running database migrations"
if ! npx prisma migrate deploy; then
  echo "==> Baselining existing database and retrying migrations"
  npx prisma migrate resolve --applied 20250624000000_init || true
  npx prisma migrate deploy
fi

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
