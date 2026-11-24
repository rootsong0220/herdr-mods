// Finds the file an agent meant by a path that is relative to somewhere other than the terminal's folder.
// usage: node resolve.mjs <cwd> <path as printed> [<path Herdr resolved>]
// Prints "<absolute path>\t<text|binary|dir>" for the first match, in this order:
//   Herdr's own path, cwd/<path>, <git root>/<path>, the one file in the repo ending in /<path>,
//   the one file under the home folder ending in /<path>. Exits 1 when nothing (or more than one) matches.
import { execFileSync } from "node:child_process";
import { closeSync, existsSync, openSync, readSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { basename, isAbsolute, join, resolve } from "node:path";

// Herdr's readTextFile reads at most 1 MiB; bigger text goes to the usual opener.
const MAX_TEXT_BYTES = 1 << 20;
const HOME_DEPTH = 8;
const HOME_BUDGET_MS = 4000;

export function contentOf(path) {
  const st = statSync(path);
  if (st.isDirectory()) return "dir";
  if (st.size > MAX_TEXT_BYTES) return "binary";
  const fd = openSync(path, "r");
  try {
    const buf = Buffer.alloc(Math.min(8192, st.size));
    readSync(fd, buf, 0, buf.length, 0);
    return buf.includes(0) ? "binary" : "text";
  } finally {
    closeSync(fd);
  }
}

// "a/b.ts" matches "x/a/b.ts" but not "xa/b.ts".
export const endsWithPath = (full, rel) => {
  const f = full.split(/[\\/]/), r = rel.split(/[\\/]/).filter(Boolean);
  return r.length > 0 && f.length >= r.length && r.every((part, i) => f[f.length - r.length + i] === part);
};

const isFile = (p) => { try { return statSync(p).isFile(); } catch { return false; } };

function git(cwd, args) {
  try { return execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 << 20 }); }
  catch { return null; }
}

// Walks the home folder, skipping hidden folders and node_modules; stops at the second match or the budget.
function homeMatches(home, rel) {
  const deadline = Date.now() + HOME_BUDGET_MS, name = basename(rel), out = [];
  const walk = (dir, depth) => {
    if (out.length > 1 || depth > HOME_DEPTH || Date.now() > deadline) return;
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (out.length > 1) return;
      const p = join(dir, e.name);
      if (e.isDirectory()) { if (!e.name.startsWith(".") && e.name !== "node_modules") walk(p, depth + 1); }
      else if (e.name === name && endsWithPath(p, rel)) out.push(p);
    }
  };
  walk(home, 0);
  return out;
}

export function find(cwd, printed, herdrPath, home = homedir()) {
  const rel = printed.replace(/^\.[\\/]/, "");
  if (herdrPath && existsSync(herdrPath)) return herdrPath;
  if (rel.startsWith("~/") || rel.startsWith("~\\")) { const p = join(home, rel.slice(2)); return existsSync(p) ? p : null; }
  if (isAbsolute(rel)) return existsSync(rel) ? rel : null;
  if (cwd && existsSync(join(cwd, rel))) return join(cwd, rel);
  const root = cwd ? git(cwd, ["rev-parse", "--show-toplevel"])?.trim() : null;
  if (root) {
    if (existsSync(join(root, rel))) return join(root, rel);
    const listed = git(root, ["ls-files", "--cached", "--others", "--exclude-standard"]) ?? "";
    const hits = listed.split("\n").filter((f) => f && endsWithPath(f, rel));
    if (hits.length === 1 && isFile(join(root, hits[0]))) return resolve(root, hits[0]);
    if (hits.length > 1) return null;
  }
  if (!/[\\/]/.test(rel)) return null; // a bare name would match too many files
  const hits = homeMatches(home, rel);
  return hits.length === 1 ? hits[0] : null;
}

if (process.argv[1] && basename(process.argv[1]) === "resolve.mjs") {
  const [cwd, printed, herdrPath] = process.argv.slice(2);
  const found = printed ? find(cwd || null, printed, herdrPath || null) : null;
  if (!found) process.exit(1);
  console.log(`${found}\t${contentOf(found)}`);
}
