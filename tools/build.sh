#!/usr/bin/env bash
# build.sh — build the Kali+ arsenal image, then validate it with the existing presence smoke.
# Usage: bash tools/build.sh [IMAGE_TAG]   (default: cybench-tools:latest)
set -euo pipefail
cd "$(dirname "$0")"

IMAGE="${1:-cybench-tools:latest}"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker not found — install Docker Desktop / engine first."; exit 1
fi

NODE_VERSION="$(tr -d '[:space:]' < ../.nvmrc)"
if [[ -z "$NODE_VERSION" ]]; then
  echo "Missing Node version in ../.nvmrc" >&2
  exit 1
fi

echo "Building $IMAGE (linux/amd64, Node ${NODE_VERSION}) — this is heavy (~minutes, multi-GB)…"
docker build --platform linux/amd64 --build-arg "NODE_VERSION=${NODE_VERSION}" -t "$IMAGE" .

echo
echo "Validating with the presence smoke (scripts/check-tools-image.sh)…"
bash ../scripts/check-tools-image.sh "$IMAGE"

echo
echo "Done. Point the hunter at it:  node scripts/cybench-bench.mjs --tools-image $IMAGE --arsenal-tools all …"
