#!/usr/bin/env bash
set -euo pipefail

backup_directory=/var/backups/ballistic
environment_file=/etc/ballistic/production.env
project_directory=/opt/ballistic
timestamp="$(date -u '+%Y-%m-%dT%H-%M-%SZ')"
temporary_file="${backup_directory}/.${timestamp}.dump.tmp"
backup_file="${backup_directory}/${timestamp}.dump"

install --directory --mode 0700 "${backup_directory}"

database_id="$(
    BALLISTIC_ENV_FILE="${environment_file}" \
        docker compose \
        --env-file "${environment_file}" \
        --file "${project_directory}/docker-compose.production.yml" \
        ps --quiet database
)"

if [[ -z "${database_id}" ]] || [[ "$(docker inspect --format '{{.State.Running}}' "${database_id}")" != "true" ]]; then
    echo 'Ballistic production database is not running' >&2
    exit 1
fi

umask 077
docker exec "${database_id}" sh -lc \
    'pg_dump -Fc --no-owner --no-acl -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
    >"${temporary_file}"

docker run --rm \
    --volume "${backup_directory}:/backups:ro" \
    postgres:17 \
    pg_restore --list "/backups/.${timestamp}.dump.tmp" \
    >/dev/null

mv "${temporary_file}" "${backup_file}"
chmod 600 "${backup_file}"
find "${backup_directory}" -type f -name '*.dump' -mtime +14 -delete
