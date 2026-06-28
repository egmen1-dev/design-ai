#!/usr/bin/env bash
# Пишет VPS_SSH_KEY из секретов агента в deploy/ssh/github-actions-deploy
set -euo pipefail

KEY_FILE="${1:-deploy/ssh/github-actions-deploy}"

if [ -f "$KEY_FILE" ]; then
  exit 0
fi

if [ -z "${VPS_SSH_KEY:-}" ]; then
  echo "VPS_SSH_KEY not set — add it in Cursor Agent secrets"
  exit 1
fi

mkdir -p "$(dirname "$KEY_FILE")"
# shellcheck disable=SC2154
printf '%s\n' "${VPS_SSH_KEY}" > "$KEY_FILE"
chmod 600 "$KEY_FILE"
echo "SSH key ready at $KEY_FILE"
