#!/bin/sh
set -eu
: "${OWNER_LOGIN:?OWNER_LOGIN is required}"
: "${OWNER_PASSWORD_HASH:?OWNER_PASSWORD_HASH is required}"
: "${BACKEND_HOST:?BACKEND_HOST is required}"
umask 077
printf '%s:%s\n' "$OWNER_LOGIN" "$OWNER_PASSWORD_HASH" > /etc/nginx/owner.htpasswd
