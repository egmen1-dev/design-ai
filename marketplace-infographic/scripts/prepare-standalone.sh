#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STANDALONE="${ROOT}/.next/standalone"

if [ ! -d "${STANDALONE}" ]; then
  echo "ERROR: ${STANDALONE} not found — run next build first"
  exit 1
fi

echo "==> Preparing standalone runtime assets"

mkdir -p "${STANDALONE}/.next"
cp -r "${ROOT}/.next/static" "${STANDALONE}/.next/static"
cp -r "${ROOT}/templates" "${STANDALONE}/templates"

copy_pkg_assets() {
  local pkg="$1"
  local src="${ROOT}/node_modules/${pkg}"
  local dest="${STANDALONE}/node_modules/${pkg}"

  if [ ! -d "${src}" ]; then
    echo "WARN: missing package ${pkg}"
    return 0
  fi

  mkdir -p "${dest}"
  cp -a "${src}/." "${dest}/"
  echo "==> Synced ${pkg}"
}

# Next file tracing omits wasm/model blobs required at runtime.
copy_pkg_assets "tesseract.js-core"
copy_pkg_assets "tesseract.js"
copy_pkg_assets "@imgly/background-removal-node"
copy_pkg_assets "onnxruntime-node"
copy_pkg_assets "onnxruntime-common"

echo "==> Standalone assets ready"
