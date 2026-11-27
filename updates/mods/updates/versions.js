const parse = (tag) => /^v(\d+)\.(\d+)\.(\d+)$/.exec(tag)?.slice(1).map(Number) ?? null;

/** True when tag a is a higher vX.Y.Z than tag b. */
export function newer(a, b) {
  const x = parse(a), y = parse(b);
  if (!x || !y) return false;
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i];
  return false;
}

/** The highest vX.Y.Z tag in `git ls-remote --tags --refs` output, or null. */
export function latestTag(lsRemote) {
  const tags = lsRemote.split("\n").map((l) => l.split("refs/tags/")[1]?.trim()).filter((t) => t && parse(t));
  return tags.reduce((best, t) => (!best || newer(t, best) ? t : best), null);
}
