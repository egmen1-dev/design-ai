#!/usr/bin/env bash
set -euo pipefail

URL="${1:-http://127.0.0.1:3000/api/health}"

echo "==> Checking ${URL}"
BODY="$(curl -fsS "${URL}")"
echo "${BODY}" | python3 -m json.tool 2>/dev/null || echo "${BODY}"

if echo "${BODY}" | grep -q '"pipelineVersion":"v3-styles"'; then
  echo "==> OK: новый пайплайн v3-styles задеплоен"
  exit 0
fi

echo "==> WARN: pipelineVersion не v3-styles — на сервере СТАРЫЙ код"
echo "    Запустите: cd /opt/design-ai && git pull && ./scripts/deploy.sh"
exit 1
