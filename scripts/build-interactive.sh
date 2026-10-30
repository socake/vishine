#!/bin/sh
# Build tracked TypeScript sources into ignored Hugo assets.
set -eu
VISHINE_ENGINE_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../packages/knowledge-engine" && pwd)
cd "$VISHINE_ENGINE_ROOT"
if [ ! -d node_modules ]; then npm ci; fi
npm run build
