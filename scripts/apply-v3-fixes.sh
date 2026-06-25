#!/usr/bin/env bash
# Применить фиксы v3-styles поверх коммита 277bf14 на VPS
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/design-ai}"
PATCH="${APP_DIR}/patches/v3-fixes.patch"

cd "${APP_DIR}"

if [ ! -f "${PATCH}" ]; then
  echo "ERROR: Нет файла ${PATCH}"
  echo "Скопируйте patches/v3-fixes.patch на VPS:"
  echo "  scp patches/v3-fixes.patch root@СЕРВЕР:/opt/design-ai/patches/"
  exit 1
fi

echo "==> Current: $(git log --oneline -1)"
git apply --check "${PATCH}"
git apply "${PATCH}"
echo "==> Patched. Rebuild..."

bash "${APP_DIR}/scripts/force-rebuild.sh"
