#!/usr/bin/env bash
set -euo pipefail
TAG="${1:?usage: ./deploy.sh <tag>}"
SERVER=(ssh -p 2006 stefan@192.168.100.50)
SCP_TARGET="stefan@192.168.100.50:linkbox/"
IDENTITY='^https://github.com/StefBisti/linkbox/'
ISSUER='https://token.actions.githubusercontent.com'

if [[ ! "$TAG" =~ ^[A-Za-z0-9._-]+$ ]]; then
  echo "invalid tag: $TAG" >&2
  exit 1
fi

# verify images
for app in api web; do
  echo "verifying linkbox-$app:$TAG"
  cosign verify "ghcr.io/stefbisti/linkbox-$app:$TAG" --certificate-identity-regexp "$IDENTITY" --certificate-oidc-issuer "$ISSUER" > /dev/null
done

# copy the deploy files on the server
scp -q -P 2006 compose.prod.yaml Caddyfile "$SCP_TARGET"

# used for rollback
PREVIOUS=$("${SERVER[@]}" "cat ~/linkbox/.deployed 2>/dev/null || true")
echo "currently: ${PREVIOUS:-nothing}"

deploy() {
  local tag="$1"
  "${SERVER[@]}" "cd ~/linkbox && export TAG='$tag' && docker compose -f compose.prod.yaml pull -q && docker compose -f compose.prod.yaml up -d --wait --remove-orphans"
}

# on failure, rollback
echo "deploying $TAG"
if deploy "$TAG"; then
  "${SERVER[@]}" "echo '$TAG' > ~/linkbox/.deployed"
  echo "deployed $TAG"
else
  echo "deploy of $TAG failed" >&2
  if [[ -n "$PREVIOUS" ]]; then
    echo "rolling back to version $PREVIOUS" >&2
    deploy "$PREVIOUS"
    echo "rolled back to $PREVIOUS" >&2
  fi
  exit 1
fi
