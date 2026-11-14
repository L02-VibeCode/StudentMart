#!/usr/bin/env bash
set -euo pipefail

# Installed on the VPS in /opt/studentmart; secrets remain in backend.env there.
image="${1:?Pass the reviewed image digest}"
apply_migrations="${2:-false}"
backup_confirmed="${3:-false}"
[[ "$image" =~ ^ghcr\.io/[a-z0-9._/-]+:[a-f0-9]{40}@sha256:[a-f0-9]{64}$ ]] || { echo 'Invalid immutable image reference'; exit 2; }
[[ "$apply_migrations" == false || "$apply_migrations" == true ]] || exit 2
[[ "$backup_confirmed" == false || "$backup_confirmed" == true ]] || exit 2
if [[ "$apply_migrations" == true && "$backup_confirmed" != true ]]; then
  echo 'Database backup confirmation is required before migrations'; exit 2
fi
cd /opt/studentmart
test -f backend.env || { echo 'Configure /opt/studentmart/backend.env first'; exit 2; }
export API_IMAGE="$image"
compose=(docker compose -f compose.production.yml)
"${compose[@]}" pull api
if [[ "$apply_migrations" == true ]]; then
  "${compose[@]}" run --rm --no-deps api node node_modules/typeorm/cli.js migration:run -d dist/shared/database/data-source.js
fi
# Without explicit migration approval, schema drift/pending migrations stop deployment.
"${compose[@]}" run --rm --no-deps api node dist/shared/database/check-database.js
previous=''
if [[ -f current-image ]]; then previous="$(cat current-image)"; fi
if ! "${compose[@]}" up -d --wait --wait-timeout 120 api; then
  echo 'New API did not become healthy'
  if [[ -n "$previous" ]]; then
    echo 'Restoring previous application image; database is not reverted'
    API_IMAGE="$previous" "${compose[@]}" up -d --wait --wait-timeout 120 api || echo 'Application rollback failed; operator intervention required'
  fi
  exit 1
fi
printf '%s\n' "$image" > current-image
echo 'API deployment healthy; image reference recorded'
