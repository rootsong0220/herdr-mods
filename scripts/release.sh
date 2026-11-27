#!/bin/sh
# Tags a release and pushes it with main: scripts/release.sh 0.2.0
set -eu
cd "$(dirname "$0")/.."
v="v${1:?usage: scripts/release.sh <X.Y.Z>}"
grep -q "^## $v " CHANGELOG.md || { echo "CHANGELOG.md has no '## $v' section" >&2; exit 1; }
[ -z "$(git status --porcelain)" ] || { echo "commit or stash your changes first" >&2; exit 1; }
git tag -a "$v" -m "$v"
git push origin HEAD:main "$v"
