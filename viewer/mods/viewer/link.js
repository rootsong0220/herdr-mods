// Ctrl/Cmd-click on a file or web address in a terminal: show it in a viewer pane next to it.
// Agents print paths relative to the repo root or to some other folder, so a path that isn't
// under the terminal's folder is looked up by resolve.mjs. A tab with a viewer already reuses it.
// Folders and binary files go on to the usual opener; a file that can't be found gets a toast.
import { appHome, exec, notify, panes, run, setShared, shared } from "herdr";
import { WEB, candidates, kindOf } from "./kinds.js";

const RESOLVE_TIMEOUT_MS = 8000;

class NodeFailed extends Error {}

function remember(entry) {
  setShared("viewer.clicks", [entry, ...((shared("viewer.clicks") ?? []).slice(0, 4))]);
}

async function lookup(c, link, source, first) {
  // A rejection means node couldn't run (missing, or too slow): that is not "file not found".
  const r = await exec("node", [`${appHome()}/mods/viewer/resolve.mjs`, source.cwd ?? "", c.path, first ? (link.path ?? "") : ""],
    { timeout: RESOLVE_TIMEOUT_MS }).catch((e) => { throw new NodeFailed(String(e?.message ?? e)); });
  if (r.code !== 0) return null;
  const [target, content] = r.stdout.trim().split("\t");
  return { target, content, line: c.line };
}

// The first candidate is Herdr's own reading; if it fails, the cleaned pieces must point at one file.
async function resolveFile(link, source) {
  const [first, ...rest] = candidates(link.raw);
  const own = first && await lookup(first, link, source, true);
  if (own) return own;
  const hits = [];
  for (const c of rest) {
    const hit = await lookup(c, link, source, false);
    if (hit && !hits.some((h) => h.target === hit.target)) hits.push(hit);
  }
  return hits.length === 1 ? hits[0] : hits.length ? { ambiguous: hits.map((h) => h.target) } : null;
}

function show(found, source) {
  if (panes().some((p) => p.mod === "viewer" && p.tab === source.tab)) {
    setShared("viewer.show", { tab: source.tab, ...found, n: Date.now() });
  } else {
    run("pane.split", { direction: "right", pane: source.pane ?? undefined, mod: "viewer", props: { ...found, tab: source.tab } });
  }
}

export async function handleLink({ link, source }) {
  // image(), Chrome and resolve.mjs work on this computer's files only.
  if (source.machine || !source.tab) return "pass";
  if (link.kind === "url") {
    if (!WEB.test(link.url)) return "pass";
    show({ target: link.url, kind: "page", line: null }, source);
    return "handled";
  }
  let hit;
  try {
    hit = await resolveFile(link, source);
  } catch (e) {
    if (!(e instanceof NodeFailed)) throw e;
    notify({ title: "Viewer needs Node.js 22+", body: `Couldn't run node: ${e.message}`, level: "error", timeout: 8000 });
    return "pass";
  }
  remember({ at: Date.now(), raw: link.raw, path: link.path ?? null, cwd: source.cwd, hit });
  if (!hit) {
    // Name the cleaned-up paths that were looked for ("/dev/x.ts", not "/dev/x.ts를"), so the toast doesn't blame the particle.
    const tried = candidates(link.raw).slice(1).map((c) => c.path);
    notify({ title: "File not found", body: `${tried.length ? tried.join(", ") : link.raw}\nnot under ${source.cwd ?? "?"}, its git repo or your home folder`, level: "warning", timeout: 5000 });
    return "handled";
  }
  if (hit.ambiguous) {
    notify({ title: "Which file?", body: `The click covered several paths:\n${hit.ambiguous.join("\n")}`, level: "warning", timeout: 6000 });
    return "handled";
  }
  if (hit.content === "dir") return "pass";
  const kind = kindOf(hit.target) ?? (hit.content === "text" ? "text" : null);
  if (!kind) return "pass";
  show({ target: hit.target, kind, line: hit.line }, source);
  return "handled";
}
