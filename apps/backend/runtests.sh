#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SAIL="${SCRIPT_DIR}/vendor/bin/sail"

# 1) Cache testing config
"$SAIL" artisan config:cache --env=testing

# 2) Run tests (accept any args, e.g. a single file)
"$SAIL" artisan test --env=testing "$@"
EXIT_CODE=$?

# 3) Clear the cache so dev goes back to .env
"$SAIL" artisan config:clear

exit $EXIT_CODE
