#!/usr/bin/env bash
# Reassemble FULL-PROJECT-ARCHIVE.tar.gz from split parts (40 MB each)
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

if ls FULL-PROJECT-ARCHIVE-40M.part-* 1>/dev/null 2>&1; then
  PARTS=(FULL-PROJECT-ARCHIVE-40M.part-*)
elif ls FULL-PROJECT-ARCHIVE.tar.gz.part-* 1>/dev/null 2>&1; then
  PARTS=(FULL-PROJECT-ARCHIVE.tar.gz.part-*)
else
  echo "No part files found in $DIR" >&2
  exit 1
fi

echo "Merging ${#PARTS[@]} parts..."
OUT="FULL-PROJECT-ARCHIVE.tar.gz"
cat "${PARTS[@]}" > "$OUT"
echo "Created $OUT ($(du -h "$OUT" | cut -f1))"
echo "Extract with: tar -xzf $OUT"
