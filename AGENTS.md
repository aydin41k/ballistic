# AGENTS.md

This file applies to Codex, Cursor, Claude, and other coding agents working in this repository.

## Backend testing rule (mandatory)

For Laravel backend work, do **not** stop at "php is not installed" or skip verification because the host lacks PHP.

Use the project's actual test path:

1. `cd apps/backend`
2. `./vendor/bin/sail up -d`
3. `./runtests.sh`
4. fix failures
5. rerun `./runtests.sh` until green

### Never do this instead
- `php artisan test`
- `sail artisan test`
- claiming tests could not be run just because host PHP is unavailable

## Frontend verification
- Do not add frontend unit tests if the repo does not use them.
- Run the repo's real frontend checks (lint/build/etc.) as appropriate.

## General
- Before wrapping up, make sure the relevant checks actually passed.
- Before any push, run **all CI/CD-equivalent checks locally** for the affected repo areas, not just a subset that seems relevant.
- Pull/fetch first, then run the full local check set, then push only if green.
- Do not use GitHub Actions as the first place to discover avoidable lint/test failures.
- Follow existing repo instructions in `CLAUDE.md` too; this file is here to make sure non-Claude agents get the same rules.
- Use Australian spelling in user-facing/project text.
