#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

date -Is
./node_modules/.bin/jest --runInBand "$@"


