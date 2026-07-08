#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
ENV_FILE="$ROOT/.env.play"

if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

# Load signing + release variables for Android Play publishing.
# Reads password from a local file if present:
#   $HOME/.fireworks-play/fireworks-upload.password

KEY_FILE="${FIREWORKS_RELEASE_STORE_FILE:-$HOME/.fireworks-play/fireworks-upload.jks}"
KEY_ALIAS="${FIREWORKS_RELEASE_KEY_ALIAS:-fireworks-upload}"
KEY_PW_FILE="$HOME/.fireworks-play/fireworks-upload.password"

if [ ! -f "$KEY_FILE" ]; then
  echo "Play signing key not found: $KEY_FILE" >&2
  return 1
fi

if [ ! -f "$KEY_PW_FILE" ]; then
  echo "Password file not found: $KEY_PW_FILE" >&2
  echo "Set FIREWORKS_RELEASE_STORE_PASSWORD / FIREWORKS_RELEASE_KEY_PASSWORD manually." >&2
  return 1
fi

KEY_PASSWORD="$(cat "$KEY_PW_FILE")"

export FIREWORKS_RELEASE_STORE_FILE="$KEY_FILE"
export FIREWORKS_RELEASE_STORE_PASSWORD="$KEY_PASSWORD"
export FIREWORKS_RELEASE_KEY_ALIAS="$KEY_ALIAS"
export FIREWORKS_RELEASE_KEY_PASSWORD="$KEY_PASSWORD"

export FIREWORKS_VERSION_CODE="${FIREWORKS_VERSION_CODE:-1}"
export FIREWORKS_VERSION_NAME="${FIREWORKS_VERSION_NAME:-1.0}"

echo "Loaded Play release env:"
echo "- FIREWORKS_RELEASE_STORE_FILE=$FIREWORKS_RELEASE_STORE_FILE"
echo "- FIREWORKS_RELEASE_KEY_ALIAS=$FIREWORKS_RELEASE_KEY_ALIAS"
echo "- FIREWORKS_VERSION_CODE=$FIREWORKS_VERSION_CODE"
echo "- FIREWORKS_VERSION_NAME=$FIREWORKS_VERSION_NAME"
