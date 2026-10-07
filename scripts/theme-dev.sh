#!/bin/sh
# Portable local entry point; all generated files stay outside tracked source.
set -eu
VISHINE_THEME_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
VISHINE_MODE=${1:-serve}
VISHINE_SITE=${2:-exampleSite}
case "$VISHINE_SITE" in exampleSite|tutorialSite) ;; *) echo 'Site must be exampleSite or tutorialSite' >&2; exit 2;; esac
case "$VISHINE_MODE" in build|serve) ;; *) echo 'Usage: sh scripts/theme-dev.sh [build|serve] [exampleSite|tutorialSite]' >&2; exit 2;; esac
VISHINE_RUN_DIR=${VISHINE_RUNTIME_DIR:-"$VISHINE_THEME_ROOT/.local"}
HUGO_BIN=${HUGO_BIN:-hugo}
mkdir -p "$VISHINE_RUN_DIR/$VISHINE_SITE/resources" "$VISHINE_RUN_DIR/cache"
export HUGO_RESOURCEDIR="$VISHINE_RUN_DIR/$VISHINE_SITE/resources"
if [ "$VISHINE_MODE" = serve ]; then
  exec "$HUGO_BIN" server --source "$VISHINE_THEME_ROOT/$VISHINE_SITE" --themesDir "$(dirname "$VISHINE_THEME_ROOT")" --theme "$(basename "$VISHINE_THEME_ROOT")" --cacheDir "$VISHINE_RUN_DIR/cache" --destination "$VISHINE_RUN_DIR/$VISHINE_SITE/public" --bind 127.0.0.1 --port "${VISHINE_PORT:-1314}" --disableFastRender
else
  exec "$HUGO_BIN" --source "$VISHINE_THEME_ROOT/$VISHINE_SITE" --themesDir "$(dirname "$VISHINE_THEME_ROOT")" --theme "$(basename "$VISHINE_THEME_ROOT")" --cacheDir "$VISHINE_RUN_DIR/cache" --destination "$VISHINE_RUN_DIR/$VISHINE_SITE/public" --minify
fi
