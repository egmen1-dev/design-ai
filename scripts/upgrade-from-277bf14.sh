#!/usr/bin/env bash
# Обновление с 277bf14 до v3-styles (когда GitHub не получил новые коммиты)
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/design-ai}"
BUNDLE="${1:-${APP_DIR}/patches/v3-styles.bundle}"

cd "${APP_DIR}"

if [ -f "${BUNDLE}" ]; then
  echo "==> Pulling from bundle: ${BUNDLE}"
  git pull "${BUNDLE}" main
elif [ -f "${APP_DIR}/patches/v3-styles-after-277bf14.patch" ]; then
  echo "==> Applying patch"
  git apply "${APP_DIR}/patches/v3-styles-after-277bf14.patch"
else
  echo "ERROR: Нужен файл patches/v3-styles.bundle или patches/v3-styles-after-277bf14.patch"
  echo ""
  echo "Скопируйте на VPS из Cursor/репозитория:"
  echo "  scp patches/v3-styles.bundle root@ВАШ_IP:/opt/design-ai/patches/"
  echo "  scp patches/v3-styles-after-277bf14.patch root@ВАШ_IP:/opt/design-ai/patches/"
  exit 1
fi

echo "==> Commit after upgrade: $(git log --oneline -1)"

bash "${APP_DIR}/scripts/force-rebuild.sh"
