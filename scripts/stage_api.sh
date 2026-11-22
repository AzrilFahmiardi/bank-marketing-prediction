#!/usr/bin/env bash
# Assemble a self-contained build context for the API (used for Docker and Hugging Face Spaces).
set -euo pipefail
DEST="${1:?usage: stage_api.sh <dest-dir>}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$DEST"
rm -rf "$DEST/app" "$DEST/bank_marketing" "$DEST/artifacts"
cp -r "$ROOT/api/app" "$DEST/app"
cp -r "$ROOT/ml/src/bank_marketing" "$DEST/bank_marketing"
cp -r "$ROOT/ml/artifacts" "$DEST/artifacts"
cp "$ROOT/api/Dockerfile" "$ROOT/api/requirements.txt" "$DEST/"
find "$DEST" -name __pycache__ -type d -prune -exec rm -rf {} +
echo "Staged API build context in $DEST"
