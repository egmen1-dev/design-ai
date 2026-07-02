#!/usr/bin/env bash
# Reassemble FULL-PROJECT-ARCHIVE.tar.gz from GitHub split parts
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"
PARTS=(FULL-PROJECT-ARCHIVE.tar.gz.part-*)
if [ ! -e "${PARTS[0]}" ]; then
  echo "No part files found in $DIR" >&2
  exit 1
fi
echo "Merging ${#PARTS[@]} parts..."
cat FULL-PROJECT-ARCHIVE.tar.gz.part-* > FULL-PROJECT-ARCHIVE.tar.gz
echo "Created FULL-PROJECT-ARCHIVE.tar.gz ($(du -h FULL-PROJECT-ARCHIVE.tar.gz | cut -f1))"
echo "Extract with: tar -xzf FULL-PROJECT-ARCHIVE.tar.gz"
