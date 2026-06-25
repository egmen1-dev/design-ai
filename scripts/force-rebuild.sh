#!/usr/bin/env bash
# Принудительная пересборка — когда git обновился, а /api/health без pipelineVersion
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/design-ai}"
APP_NAME="marketplace-infographic"

echo "==> Force rebuild design-ai"
cd "${APP_DIR}"

echo "==> Git status"
git fetch origin main
git checkout main
git pull origin main
echo "==> Commit: $(git log --oneline -1)"

cd "${APP_DIR}/${APP_NAME}"

echo "==> Clean old build"
pm2 delete marketplace-infographic 2>/dev/null || true
rm -rf .next node_modules

echo "==> Install + build"
export npm_config_onnxruntime_node_install_cuda=skip
NODE_ENV=development npm ci
npx prisma generate
npm run build

echo "==> Start PM2"
mkdir -p "${APP_DIR}/logs"
cd "${APP_DIR}"
pm2 start ecosystem.config.cjs --update-env
pm2 save

sleep 3
echo "==> Health check"
HEALTH="$(curl -fsS http://127.0.0.1:3000/api/health)"
echo "${HEALTH}"

if echo "${HEALTH}" | grep -q '"pipelineVersion":"v3-styles"'; then
  echo "==> SUCCESS: v3-styles is live"
else
  echo "==> FAIL: still old build — send this output for debugging"
  exit 1
fi
