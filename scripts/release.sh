#!/bin/sh
# Tags a release and pushes it with main: scripts/release.sh 0.2.0
set -eu
cd "$(dirname "$0")/.."
v="v${1:?usage: scripts/release.sh <X.Y.Z>}"
grep -q "^## $v " CHANGELOG.md || { echo "CHANGELOG.md has no '## $v' section" >&2; exit 1; }
[ -z "$(git status --porcelain)" ] || { echo "commit or stash your changes first" >&2; exit 1; }
# installed offers only the mods in its CATALOG: a new mod folder must be listed there.
for m in */mods/*/; do
  n=$(basename "$m")
  grep -q "\[\"$n\"," installed/mods/installed/main.js || { echo "$n is missing from CATALOG in installed/mods/installed/main.js" >&2; exit 1; }
done
git tag -a "$v" -m "$v"
git push origin HEAD:main "$v"
