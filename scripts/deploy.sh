#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/design-ai}"
APP_NAME="marketplace-infographic"
BRANCH="${DEPLOY_BRANCH:-main}"

if [ -f "${APP_DIR}/.deploy-skip-git" ]; then
  export SKIP_GIT_PULL=1
fi

echo "==> Deploying design-ai from branch ${BRANCH}"

cd "${APP_DIR}"

if [ "${SKIP_GIT_PULL:-}" = "1" ]; then
  echo "==> SKIP_GIT_PULL=1 — оставляем код на диске без git reset"
elif [ -d .git ]; then
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

mkdir -p "${APP_DIR}/logs"

echo "==> Removing previous Next.js build"
rm -rf .next node_modules

echo "==> Installing dependencies (with devDependencies for build)"
export npm_config_onnxruntime_node_install_cuda=skip
# NODE_ENV=production on VPS skips devDeps — next build needs typescript/tailwind
NODE_ENV=development npm ci

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

echo "==> Starting PM2 process"
cd "${APP_DIR}"
if pm2 describe marketplace-infographic >/dev/null 2>&1; then
  pm2 reload ecosystem.config.cjs --update-env
else
  pm2 start ecosystem.config.cjs --update-env
fi

pm2 save
pm2 status marketplace-infographic

echo "==> Verifying local app routes"
sleep 3
curl -fsS http://127.0.0.1:3000/register | grep -q "Регистрация"

echo "==> Pipeline version"
if curl -fsS http://127.0.0.1:3000/api/health | grep -q '"pipelineVersion":"v3-styles"'; then
  echo "==> OK: v3-styles active"
else
  echo "==> WARN: старый код — проверьте git pull и ветку main"
fi

echo "==> Deploy complete"
