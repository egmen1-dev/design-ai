#!/usr/bin/env bash
# Собирает архив исходников для внешнего аудита (ChatGPT, ревьюер и т.д.)
# Без секретов, ключей, билдов, пользовательских загрузок.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="${ROOT}/dist"
STAMP="$(date -u +%Y%m%d)"
BUNDLE_NAME="design-ai-audit-${STAMP}"
STAGING="${OUT_DIR}/${BUNDLE_NAME}"
ARCHIVE="${OUT_DIR}/${BUNDLE_NAME}.tar.gz"

mkdir -p "${OUT_DIR}"
rm -rf "${STAGING}"
mkdir -p "${STAGING}"

echo "==> Exporting tracked sources (git archive)"
git -C "${ROOT}" archive HEAD --format=tar | tar -x -C "${STAGING}"

echo "==> Removing accidental npm cache / Кабинет paths (not part of the app)"
find "${STAGING}" -type d \( -name '.npm' -o -name 'Кабинет' \) -prune -exec rm -rf {} + 2>/dev/null || true
find "${STAGING}" -type f -name '*Кабинет*' -delete 2>/dev/null || true

echo "==> Removing deploy secrets and infra-only paths"
rm -f "${STAGING}/deploy/ssh/github-actions-deploy" 2>/dev/null || true
rm -f "${STAGING}/deploy/ssh/"*.pub 2>/dev/null || true

echo "==> Sanitizing PII and production identifiers"
sanitize_file() {
  local f="$1"
  [ -f "$f" ] || return 0
  sed -i \
    -e 's/maksim00i@mail\.ru/admin@example.com/g' \
    -e 's/194\.226\.115\.138/YOUR_VPS_HOST/g' \
    -e 's|https://design-ai\.shop|https://your-domain.example|g' \
    -e 's/design-ai\.shop/your-domain.example/g' \
    "$f"
}

sanitize_file "${STAGING}/marketplace-infographic/.env.example"
sanitize_file "${STAGING}/marketplace-infographic/src/lib/admin.ts"
sanitize_file "${STAGING}/deploy/ssh/README.md"
sanitize_file "${STAGING}/DEPLOY.md"

echo "==> Writing audit guide"
cp "${ROOT}/AUDIT.md" "${STAGING}/AUDIT.md"

echo "==> Writing manifest"
{
  echo "# Audit bundle manifest"
  echo "- created: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "- git commit: $(git -C "${ROOT}" rev-parse --short HEAD 2>/dev/null || echo unknown)"
  echo "- branch: $(git -C "${ROOT}" branch --show-current 2>/dev/null || echo unknown)"
  echo "- pipeline: $(grep PIPELINE_VERSION "${STAGING}/marketplace-infographic/src/lib/pipeline-version.ts" 2>/dev/null | sed 's/.*"\(.*\)".*/\1/' || echo unknown)"
  echo ""
  echo "## Excluded on purpose"
  echo "- .env, .env.local (secrets)"
  echo "- node_modules, .next (build artifacts)"
  echo "- deploy/ssh private keys"
  echo "- public/generated, public/uploads, public/references (user data)"
  echo "- data/design-memory.json (runtime learning store)"
  echo ""
  echo "## Sanitized"
  echo "- admin emails → admin@example.com"
  echo "- VPS IP and production domain → placeholders"
} > "${STAGING}/AUDIT-MANIFEST.md"

echo "==> Creating archive"
tar -czf "${ARCHIVE}" -C "${OUT_DIR}" "${BUNDLE_NAME}"
rm -rf "${STAGING}"

BYTES=$(wc -c < "${ARCHIVE}" | tr -d ' ')
echo ""
echo "==> Ready: ${ARCHIVE} ($(numfmt --to=iec "${BYTES}" 2>/dev/null || echo "${BYTES} bytes"))"
echo "    Upload to ChatGPT or unzip locally. Start with AUDIT.md + AUDIT-MANIFEST.md"
