#!/usr/bin/env bash
set -euo pipefail

export PATH="/usr/local/bin:/opt/homebrew/bin:${HOME}/.rd/bin:${PATH}"

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
environment_file="${HOME}/.config/ballistic/production.env"
tunnel_token_file="${HOME}/.config/ballistic/cloudflare-tunnel-token"

if [[ ! -f "${environment_file}" ]]; then
    echo "Missing ${environment_file}" >&2
    exit 1
fi

compose=(
    docker compose
    --env-file "${environment_file}"
    --file "${root_dir}/docker-compose.production.yml"
)

if [[ -s "${tunnel_token_file}" ]]; then
    compose+=(--profile tunnel)
fi

BALLISTIC_ENV_FILE="${environment_file}" \
BALLISTIC_TUNNEL_TOKEN_FILE="${tunnel_token_file}" \
    "${compose[@]}" up --detach "$@"
