#!/usr/bin/env bash
# Copy the exported model metadata into the web app after retraining.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cp "$ROOT/ml/artifacts/metadata.json" "$ROOT/web/src/data/metadata.json"
echo "Synced metadata.json to web/src/data"
