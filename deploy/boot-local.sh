#!/usr/bin/env bash
set -euo pipefail

export PATH="/usr/local/bin:/opt/homebrew/bin:${HOME}/.rd/bin:${PATH}"
root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! docker info >/dev/null 2>&1; then
    open -gj -a "Rancher Desktop"
fi

for _ in {1..90}; do
    if docker info >/dev/null 2>&1; then
        break
    fi
    sleep 2
done

if ! docker info >/dev/null 2>&1; then
    echo "Docker did not become ready within three minutes" >&2
    exit 1
fi

if ! "${root_dir}/deploy/start-local.sh" --no-build; then
    "${root_dir}/deploy/start-local.sh" --build
fi
