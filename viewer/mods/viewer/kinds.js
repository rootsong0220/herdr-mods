// Shared by link.js and main.js: which view a target gets, and how a clicked path is written.
export const WEB = /^https?:\/\//i;
const IMAGE = /\.(png|jpe?g|gif|webp|bmp|svg)$/i;
const MARKDOWN = /\.(md|markdown)$/i;
const HTML = /\.html?$/i;

// "text" needs the file's content to decide, so it is never guessed from the name alone.
export function kindOf(target) {
  if (WEB.test(target) || HTML.test(target)) return "page";
  if (IMAGE.test(target)) return "image";
  if (MARKDOWN.test(target)) return "markdown";
  return null;
}

// "src/a.ts:42", "src/a.ts:42:7", "src/a.ts(42,7)", "file:///x/a.md" -> { path, line }
export function parseRaw(raw) {
  let s = String(raw ?? "").trim().replace(/^file:\/\/(localhost)?(?=\/)/i, "");
  try { s = decodeURIComponent(s); } catch { /* keep as printed */ }
  const m = /^(.*?)(?::(\d+)(?::\d+)?|\((\d+)(?:,\s*\d+)?\))$/.exec(s);
  return m ? { path: m[1], line: Number(m[2] ?? m[3]) } : { path: s, line: null };
}

// Herdr's detector keeps going through characters glued to a path, so Korean particles end up in it
// ("main.js를", "./README.md나 docs/x."). Strip what can't end a path printed in prose.
const LEADING = /^[`'"(<\[]+/;
const NON_ASCII_TAIL = /[^\x21-\x7e]+$/;
const PUNCT_TAIL = /[`'",;)>\]!?.]+$/;
const PAREN_LINE = /\(\d+(?:,\s*\d+)?\)$/;
export function cleanToken(token) {
  let s = token.replace(LEADING, "");
  for (let prev = null; prev !== s;) {
    prev = s;
    s = s.replace(NON_ASCII_TAIL, "");
    if (!PAREN_LINE.test(s)) s = s.replace(PUNCT_TAIL, "");
  }
  return s;
}

// What the click could mean, most likely first: the text as Herdr gave it, then each
// whitespace-separated piece cleaned up. Only pieces that look like paths are kept.
export function candidates(raw) {
  const out = [];
  const add = (c) => { if (c.path && !out.some((o) => o.path === c.path)) out.push(c); };
  const whole = parseRaw(raw);
  add(whole);
  for (const token of String(raw ?? "").trim().split(/\s+/)) {
    const c = parseRaw(cleanToken(token));
    if (/[/.]/.test(c.path)) add(c);
  }
  return out;
}
