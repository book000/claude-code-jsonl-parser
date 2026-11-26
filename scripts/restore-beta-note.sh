#!/usr/bin/env bash
set -euo pipefail

ref=refs/notes/semantic-release-v0.1.4-beta.28
tag=v0.1.4-beta.28
expected=e946f95cd5c828c13f590c119ec17f27c3b7bce1

git fetch origin '+refs/notes/*:refs/notes/*'
if git show-ref --verify --quiet "$ref"; then
  exit 0
fi
if [ "$(git rev-parse "refs/tags/$tag^{commit}")" != "$expected" ]; then
  echo "Unexpected $tag target; refusing to restore its channel metadata" >&2
  exit 1
fi
git -c user.name=semantic-release -c user.email=semantic-release@localhost \
  notes --ref="$ref" add -m '{"channels":["beta"]}' "$tag"
