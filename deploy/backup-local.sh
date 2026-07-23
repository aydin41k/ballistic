#!/usr/bin/env bash
set -euo pipefail

export PATH="/usr/local/bin:/opt/homebrew/bin:${HOME}/.rd/bin:${PATH}"

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
environment_file="${HOME}/.config/ballistic/production.env"
backup_dir="${HOME}/Backups/ballistic/automatic"
timestamp="$(date -u '+%Y-%m-%dT%H-%M-%SZ')"
temporary_file="${backup_dir}/.${timestamp}.dump.tmp"
backup_file="${backup_dir}/${timestamp}.dump"

mkdir -p "${backup_dir}"
chmod 700 "${backup_dir}"

database_id="$(
    BALLISTIC_ENV_FILE="${environment_file}" \
        docker compose \
        --env-file "${environment_file}" \
        --file "${root_dir}/docker-compose.production.yml" \
        ps --quiet database
)"

if [[ -z "${database_id}" ]] || [[ "$(docker inspect --format '{{.State.Running}}' "${database_id}")" != "true" ]]; then
    echo "Ballistic production database is not running" >&2
    exit 1
fi

umask 077
docker exec "${database_id}" sh -lc \
    'pg_dump -Fc --no-owner --no-acl -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
    > "${temporary_file}"

docker run --rm \
    --volume "${backup_dir}:/backups:ro" \
    postgres:17 \
    pg_restore --list "/backups/.${timestamp}.dump.tmp" \
    >/dev/null

mv "${temporary_file}" "${backup_file}"
chmod 600 "${backup_file}"

find "${backup_dir}" -type f -name '*.dump' -mtime +14 -delete
