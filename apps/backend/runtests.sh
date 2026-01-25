#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 1) Cache testing config
"$SCRIPT_DIR/vendor/bin/sail" artisan config:cache --env=testing

# 2) Run tests (accept any args, e.g. a single file)
"$SCRIPT_DIR/vendor/bin/sail" artisan test --env=testing "$@"
EXIT_CODE=$?

# 3) Clear the cache so dev goes back to .env
"$SCRIPT_DIR/vendor/bin/sail" artisan config:clear

exit $EXIT_CODE
