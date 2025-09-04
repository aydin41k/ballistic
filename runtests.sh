#!/usr/bin/env bash
set -e

# 1) Cache testing config
~/Code/ballistic_backend/vendor/bin/sail artisan config:cache --env=testing

# 2) Run tests (accept any args, e.g. a single file)
~/Code/ballistic_backend/vendor/bin/sail artisan test --env=testing "$@"
EXIT_CODE=$?

# 3) Clear the cache so dev goes back to .env
~/Code/ballistic_backend/vendor/bin/sail artisan config:clear

exit $EXIT_CODE
