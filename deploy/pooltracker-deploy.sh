#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

# This root-owned file contains deployment paths, not application secrets.
CONFIG=${POOLTRACKER_CONFIG:-/etc/pooltracker-deploy.conf}
if [[ -f "$CONFIG" ]]; then
    # shellcheck source=/dev/null
    source "$CONFIG"
fi
: "${APP_DIR:?Set APP_DIR in /etc/pooltracker-deploy.conf}"
REPOSITORY=${REPOSITORY:-avrland/PoolTrackerWeb}
STATE_DIR=${STATE_DIR:-/var/lib/pooltracker-deploy}
HEALTH_URL=${HEALTH_URL:-http://127.0.0.1:8008}
HEALTH_TIMEOUT=${HEALTH_TIMEOUT:-120}
COMMAND=${1:-check}
[[ "$REPOSITORY" =~ ^[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$ ]] || exit 2
[[ "$APP_DIR" = /* && "$STATE_DIR" = /* ]] || exit 2
mkdir -p "$STATE_DIR"
exec 9>"$STATE_DIR/lock"
flock -n 9 || { echo 'Another deployment is running.'; exit 0; }
cd "$APP_DIR"
COMPOSE_FILE="$APP_DIR/docker-compose.prod.yml"
STATE="$STATE_DIR/state.json"
PENDING="$STATE_DIR/pending.json"
BLOCKED="$STATE_DIR/blocked"
TMP=$(mktemp -d "$STATE_DIR/tmp.XXXXXX")
trap 'rm -rf -- "$TMP"' EXIT

log() { printf '%s %s\n' "$(date -Is)" "$*"; }
atomic() { cat > "$1.tmp"; mv -f -- "$1.tmp" "$1"; }
compose() {
    docker compose --project-directory "$APP_DIR" --env-file "$APP_DIR/.env" \
        -p "$PROJECT" -f "$COMPOSE_FILE" "$@"
}
images() {
    WEB_IMAGE=$(jq -er '.images.web' "$1") || return 1
    FRONTEND_IMAGE=$(jq -er '.images.frontend' "$1") || return 1
    SCRAPPER_IMAGE=$(jq -er '.images.scrapper' "$1") || return 1
    export WEB_IMAGE FRONTEND_IMAGE SCRAPPER_IMAGE
}
start_app() {
    compose up -d --no-deps --no-build --pull never --force-recreate web scrapper || return 1
    # nginx resolves the backend again after its container has been replaced.
    compose up -d --no-deps --no-build --pull never --force-recreate frontend
}
healthy() {
    local deadline=$((SECONDS + HEALTH_TIMEOUT)) sha=$1 running
    while (( SECONDS < deadline )); do
        running=$(docker inspect -f '{{.State.Running}} {{.State.Restarting}}' pooltracker-scrapper 2>/dev/null) || running=''
        if [[ "$running" == 'true false' ]] && \
            curl --fail --silent --max-time 5 "$HEALTH_URL/" -o /dev/null; then
            # The pre-CI image may not provide /api/health/ yet.
            if [[ "$sha" == bootstrap ]]; then
                if compose exec -T web python -c "import os; os.environ.setdefault('DJANGO_SETTINGS_MODULE','tablechart.settings'); import django; django.setup(); from django.db import connection; connection.cursor().execute('SELECT 1')"; then
                    return 0
                fi
            elif curl --fail --silent --max-time 5 "$HEALTH_URL/api/health/" | jq -e '.status == "ok"' >/dev/null; then
                return 0
            fi
        fi
        sleep 3
    done
    return 1
}
backup() {
    local output
    output="$APP_DIR/backups/predeploy-$(date -u +%Y%m%dT%H%M%SZ)-${TARGET_SHA}.sql.gz"
    mkdir -p "$APP_DIR/backups"
    # Variables are intentionally expanded inside the database container.
    # shellcheck disable=SC2016
    if compose exec -T db sh -c 'exec pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"' | gzip > "$output.partial" && \
        gzip -t "$output.partial" && [[ -s "$output.partial" ]]; then
        mv -- "$output.partial" "$output"
        log "Backup: $output"
    else
        rm -f -- "$output.partial"
        return 1
    fi
}
restore_current() {
    local old_sha
    jq -e '.current' "$STATE" > "$TMP/restore.json" || return 1
    old_sha=$(jq -er '.sha' "$TMP/restore.json") || return 1
    images "$TMP/restore.json" || return 1
    start_app && healthy "$old_sha"
}
failed() {
    local result=$?
    trap - ERR INT TERM
    log "Deployment failed; restoring the last successful images. Database is not restored."
    if [[ -f "$PENDING" ]]; then
        jq -r '.sha' "$PENDING" | atomic "$BLOCKED"
        if restore_current; then
            rm -f -- "$PENDING"
            log 'Previous version restored.'
        else
            log 'RECOVERY FAILED. Pending state retained; operator intervention required.'
        fi
    fi
    (( result != 0 )) || result=1
    exit "$result"
}
api() {
    local auth=()
    [[ -z "${GITHUB_TOKEN:-}" ]] || auth=(-H "Authorization: Bearer $GITHUB_TOKEN")
    curl --fail --silent --show-error --location --connect-timeout 10 --max-time 60 \
        "${auth[@]}" -H 'Accept: application/vnd.github+json' \
        "https://api.github.com/repos/$REPOSITORY/$1"
}

if [[ "$COMMAND" == init ]]; then
    [[ ! -f "$STATE" ]] || { log 'Already initialized.'; exit 1; }
    PROJECT=$(docker inspect -f '{{index .Config.Labels "com.docker.compose.project"}}' pooltracker-db)
    [[ -n "$PROJECT" && "$PROJECT" != '<no value>' ]] || exit 1
    # Refuse adoption if any service belongs to a different Compose project.
    for service in web frontend scrapper backup; do
        actual=$(docker inspect -f '{{index .Config.Labels "com.docker.compose.project"}}' "pooltracker-$service")
        [[ "$actual" == "$PROJECT" ]] || { log "Project mismatch: $service"; exit 1; }
    done
    volume=$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/var/lib/postgresql/data"}}{{.Name}}{{end}}{{end}}' pooltracker-db)
    [[ "$volume" == "${PROJECT}_postgres_data" ]] || { log "Unexpected database volume: $volume. Refusing adoption."; exit 1; }
    logs_volume=$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/logs"}}{{.Name}}{{end}}{{end}}' pooltracker-web)
    [[ "$logs_volume" == "${PROJECT}_logs_data" ]] || { log "Unexpected logs volume: $logs_volume. Refusing adoption."; exit 1; }
    original_dir=$(docker inspect -f '{{index .Config.Labels "com.docker.compose.project.working_dir"}}' pooltracker-db)
    [[ $(realpath "$original_dir") == $(pwd -P) ]] || { log 'APP_DIR differs from the running Compose working directory.'; exit 1; }
    log "Adopting project $PROJECT, database volume $volume"
    for service in web frontend scrapper; do
        id=$(docker inspect -f '{{.Image}}' "pooltracker-$service")
        docker image tag "$id" "pooltracker-local/$service:bootstrap"
    done
    jq -n '{sha:"bootstrap",images:{web:"pooltracker-local/web:bootstrap",frontend:"pooltracker-local/frontend:bootstrap",scrapper:"pooltracker-local/scrapper:bootstrap"}}' > "$TMP/initial.json"
    images "$TMP/initial.json"
    compose config -q
    TARGET_SHA=bootstrap
    backup
    jq -n --arg project "$PROJECT" --slurpfile current "$TMP/initial.json" \
        '{project:$project,current:$current[0],previous:null}' | atomic "$STATE"
    log 'Initialized; current containers have not been replaced.'
    exit 0
fi

[[ -f "$STATE" ]] || { log 'Run init first.'; exit 1; }
PROJECT=$(jq -er '.project' "$STATE")
if [[ "$COMMAND" == status ]]; then
    cat "$STATE"
    [[ ! -f "$PENDING" ]] || { echo 'PENDING:'; cat "$PENDING"; }
    [[ ! -f "$BLOCKED" ]] || { echo 'BLOCKED:'; cat "$BLOCKED"; }
    exit 0
fi
case "$COMMAND" in check|deploy|retry|rollback) ;; *) log 'Usage: pooltracker-deploy init|check|deploy [SHA]|retry [SHA]|rollback|status'; exit 2 ;; esac

if [[ -f "$PENDING" ]]; then
    # A crash may have occurred after the atomic success commit but before cleanup.
    if [[ $(jq -r '.sha' "$PENDING") == $(jq -r '.current.sha' "$STATE") ]]; then
        rm -f -- "$PENDING"
    else
        log 'Interrupted deployment detected; recovering before any new deployment.'
        jq -r '.sha' "$PENDING" | atomic "$BLOCKED"
        if restore_current; then
            rm -f -- "$PENDING"
        else
            log 'Recovery failed; no new deployment will be attempted.'
            exit 1
        fi
    fi
fi

if [[ "$COMMAND" == rollback ]]; then
    jq -e '.previous != null' "$STATE" >/dev/null || { log 'No previous version.'; exit 1; }
    jq '.previous' "$STATE" > "$TMP/target.json"
    TARGET_SHA=$(jq -r '.sha' "$TMP/target.json")
    # Prevent the next timer tick from immediately reinstalling the rolled-back version.
    jq -r '.current.sha' "$STATE" | atomic "$BLOCKED"
else
    TARGET_SHA=${2:-}
    if [[ -z "$TARGET_SHA" ]]; then
        if ! api commits/main > "$TMP/main.json"; then
            log 'Cannot read main; leaving running version untouched.'; exit 0
        fi
        TARGET_SHA=$(jq -er '.sha' "$TMP/main.json")
    fi
    [[ "$TARGET_SHA" =~ ^[0-9a-f]{40}$ ]] || { log 'Invalid commit SHA.'; exit 1; }
    [[ "$TARGET_SHA" != $(jq -r '.current.sha' "$STATE") ]] || { log 'Already deployed.'; exit 0; }
    if [[ "$COMMAND" != retry && -f "$BLOCKED" && $(cat "$BLOCKED") == "$TARGET_SHA" ]]; then
        log "SHA $TARGET_SHA is blocked. Use retry to explicitly retry it."; exit 0
    fi
    if ! api "releases/tags/deploy-$TARGET_SHA" > "$TMP/release.json"; then
        log 'Complete release unavailable; trying again on next tick.'; exit 0
    fi
    asset=$(jq -er '.assets[] | select(.name == "manifest.json") | .id' "$TMP/release.json")
    # Public release assets need no registry or GitHub credentials.
    if ! curl --fail --silent --show-error --location --connect-timeout 10 --max-time 60 \
        "https://github.com/$REPOSITORY/releases/download/deploy-$TARGET_SHA/manifest.json" > "$TMP/target.json"; then
        log "Cannot download manifest (asset $asset); retrying next tick."; exit 0
    fi
    jq -e --arg sha "$TARGET_SHA" --arg prefix "ghcr.io/${REPOSITORY,,}-" '
        .schema == 1 and .sha == $sha and
        ([.images | keys[]] == ["frontend","scrapper","web"]) and
        all(.images | to_entries[]; . as $entry | .value |
            startswith($prefix + $entry.key + "@sha256:") and test("@sha256:[0-9a-f]{64}$"))
    ' "$TMP/target.json" >/dev/null
fi

images "$TMP/target.json"
compose config -q
if [[ "$COMMAND" != rollback ]]; then
    # Pull everything while the old application is still serving traffic.
    compose pull web frontend scrapper
    for service in web frontend scrapper; do
        ref=$(jq -r --arg service "$service" '.images[$service]' "$TMP/target.json")
        docker image tag "$ref" "pooltracker-local/$service:$TARGET_SHA"
    done
fi
atomic "$PENDING" < "$TMP/target.json"
trap failed ERR INT TERM
log "Deploying $TARGET_SHA"
compose stop frontend web scrapper
backup
if [[ "$COMMAND" != rollback ]]; then
    compose run --rm --no-deps --entrypoint python web manage.py migrate --noinput
fi
start_app
healthy "$TARGET_SHA"
jq --slurpfile target "$TMP/target.json" '.previous = .current | .current = $target[0]' "$STATE" | atomic "$STATE"
rm -f -- "$PENDING"
if [[ "$COMMAND" == retry && -f "$BLOCKED" && $(cat "$BLOCKED") == "$TARGET_SHA" ]]; then
    rm -f -- "$BLOCKED"
fi
trap - ERR INT TERM
log "Successfully deployed $TARGET_SHA"
