#!/usr/bin/env bash
# Вставьте на VPS целиком: bash vps-paste-upgrade.sh
# Работает поверх коммита 277bf14 без git push
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/design-ai}"
PATCH_URL="${PATCH_URL:-https://raw.githubusercontent.com/egmen1-dev/design-ai/main/patches/v3-fixes.patch}"

cd "${APP_DIR}"
mkdir -p patches

echo "==> Текущий коммит: $(git log --oneline -1)"

if curl -fsSL "${PATCH_URL}" -o patches/v3-fixes.patch; then
  echo "==> Патч скачан с GitHub"
  git apply --check patches/v3-fixes.patch
  git apply patches/v3-fixes.patch
else
  echo "==> Патч на GitHub недоступен — применяем минимальный маркер v3-styles"
  mkdir -p marketplace-infographic/src/lib
  cat > marketplace-infographic/src/lib/pipeline-version.ts << 'EOF'
/** Версия SD-пайплайна — проверяйте через GET /api/health */
export const PIPELINE_VERSION = "v3-styles";
EOF
  cat > marketplace-infographic/src/app/api/health/route.ts << 'EOF'
import { NextResponse } from "next/server";
import { PIPELINE_VERSION } from "@/lib/pipeline-version";

export async function GET() {
  const checks = {
    status: "ok",
    pipelineVersion: PIPELINE_VERSION,
    timestamp: new Date().toISOString(),
    ollama: false,
    database: false,
  };

  try {
    const ollamaUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
    const res = await fetch(`${ollamaUrl}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    checks.ollama = res.ok;
  } catch {
    checks.ollama = false;
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch {
    checks.database = false;
  }

  return NextResponse.json(checks, { status: checks.database ? 200 : 503 });
}
EOF
  echo "WARN: Стили/фоны не обновлены — только health-маркер. Запушьте main на GitHub."
fi

cd "${APP_DIR}/marketplace-infographic"
pm2 delete marketplace-infographic 2>/dev/null || true
rm -rf .next node_modules

export npm_config_onnxruntime_node_install_cuda=skip
NODE_ENV=development npm ci
npx prisma generate
npm run build

cd "${APP_DIR}"
mkdir -p logs
pm2 start ecosystem.config.cjs --update-env
pm2 save

sleep 3
HEALTH="$(curl -fsS http://127.0.0.1:3000/api/health)"
echo "${HEALTH}"

if echo "${HEALTH}" | grep -q '"pipelineVersion":"v3-styles"'; then
  echo "OK: v3-styles в health"
else
  echo "FAIL: пересборка не подхватилась — пришлите: pm2 logs --lines 30"
  exit 1
fi
