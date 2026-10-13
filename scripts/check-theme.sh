#!/bin/sh
# Public release gate: two real hosts, isolated hosts, state logic and rendered SW.
set -eu
VISHINE_CHECK_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$VISHINE_CHECK_ROOT"
HUGO_BIN=${HUGO_BIN:-hugo}
export HUGO_BIN
"$HUGO_BIN" version
sh scripts/theme-dev.sh build exampleSite
sh scripts/theme-dev.sh build tutorialSite
python3 scripts/check-section-hub.py --hugo "$HUGO_BIN"
python3 scripts/check-component-docs.py --hugo "$HUGO_BIN"
python3 scripts/check-home-config.py --hugo "$HUGO_BIN"
python3 scripts/check-theme-contracts.py --hugo "$HUGO_BIN"
node --test tests/list-state.test.cjs tests/search-state.test.cjs
for VISHINE_JS_FILE in assets/js/*.js; do node --check "$VISHINE_JS_FILE"; done
git diff --check
