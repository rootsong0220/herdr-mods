// Removes the viewer's copies: `node clean.mjs <dir>` removes <dir>; with <minutes>, only the
// entries of <dir> older than that (folders left by a crash, since close() is best-effort).
import { readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";

const [dir, minutes] = process.argv.slice(2);
if (!dir) process.exit(1);
if (!minutes) {
  rmSync(dir, { recursive: true, force: true });
} else {
  const cutoff = Date.now() - Number(minutes) * 60_000;
  let names = [];
  try { names = readdirSync(dir); } catch { /* nothing yet */ }
  for (const name of names) {
    const p = join(dir, name);
    try { if (statSync(p).mtimeMs < cutoff) rmSync(p, { recursive: true, force: true }); } catch { /* gone already */ }
  }
}
