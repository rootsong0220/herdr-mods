// A pane that shows an image, a markdown file, a text/code file (at a line) or a web page
// (local .html or http/https) inside Herdr.
// Pages are full-page headless Chrome screenshots (capture.mjs): scrollable and exact, not interactive.
// Files are copied under data/viewer/ first because image() only loads paths inside Herdr's home.
import { View, div, image } from "gpui-kit";
import { v_flex, h_flex, Editor, EditorState, TextView } from "gpui-base";
import { appHome, checking, exec, props, readTextFile, settings, shared, theme, window } from "herdr";
import { WEB, kindOf } from "./kinds.js";

const LANG = { ts: "js", tsx: "js", mts: "js", cts: "js", jsx: "js", mjs: "js", cjs: "js", toml: "yaml", jsonc: "json", svelte: "html", vue: "html", kt: "kotlin", kts: "kotlin", sh: "bash", zsh: "bash", py: "python", rs: "rust", yml: "yaml", htm: "html" };
const MAX_TEXT_CHARS = 2000000;
const MD_POLL_MS = 2000;
const STALE_MIN = 24 * 60;
const CAPTURE_TIMEOUT_MS = 60000;

// UTF-16 offset of the start of a 1-based line, which is what EditorState ranges count.
export function lineOffset(text, line) {
  let offset = 0;
  for (let n = 1; n < line; n++) {
    const next = text.indexOf("\n", offset);
    if (next < 0) break;
    offset = next + 1;
  }
  return offset;
}

function codeState(text, language) {
  const t = theme();
  return EditorState.new({ language, readonly: true, value: text,
    syntax: { keyword: t.ansi5, string: t.ansi2, comment: t.dim, function: t.ansi4, type: t.ansi3, number: t.ansi1, constant: t.ansi6 } });
}

export const nameOf = (target) => (WEB.test(target) ? target.replace(WEB, "") : target.split(/[\\/]/).pop());

// Largest width that fits the pane, never above the picture's own.
export const fitWidth = (natural, pane) => Math.max(1, Math.min(natural, pane));

function opener(target) {
  const platform = window()?.platform;
  if (platform === "macos") return ["open", [target]];
  if (platform === "windows") return ["cmd", ["/c", "start", "", target]];
  return ["xdg-open", [target]];
}

export default class Viewer extends View {
  init(_props, cx) {
    const p = props() ?? {};
    this.tab = p.tab ?? null;
    this.seen = shared("viewer.show")?.n ?? 0;
    this.id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    this.width = 0;
    this.shots = 0;
    if (!checking()) {
      // close() is best-effort, so folders left by a crash are swept here.
      exec("node", [`${appHome()}/mods/viewer/clean.mjs`, `${appHome()}/data/viewer`, String(STALE_MIN)]).catch(() => null);
    }
    this.open(p.target ?? null, p.kind, p.line, cx);
    if (checking()) return;
    cx.timer.every(MD_POLL_MS, (cx) => { if (this.kind === "markdown" && !this.loading) this.loadText(cx, true); });
  }

  open(target, kind, line, cx) {
    this.target = target;
    this.kind = target ? (kind ?? kindOf(target)) : null;
    this.line = line ?? null;
    this.error = target && !this.kind ? "This file type isn't shown here" : null;
    this.text = null; this.picture = null; this.page = null; this.title = null; this.loading = false;
    this.showSource(false);
    if (this.kind === "markdown") this.loadText(cx, false);
    if (this.kind === "text") this.loadCode(cx);
    if (this.kind === "image") this.loadImage(cx);
    if (this.kind === "page" && this.width) this.capture(cx); // else on the first size report
    cx.notify();
  }

  local() {
    return this.target && !WEB.test(this.target);
  }

  nextDir() {
    const rel = `data/viewer/${this.id}/${++this.shots}`;
    return { rel, abs: `${appHome()}/${rel}` };
  }

  loadCode(cx) {
    const target = this.target, line = this.line;
    this.loading = true;
    cx.spawn(async (cx) => {
      try {
        const text = await readTextFile(target);
        if (this.target !== target) return;
        if (text == null) { this.error = "File not found"; return; }
        const body = text.length > MAX_TEXT_CHARS ? text.slice(0, MAX_TEXT_CHARS) + "\n… (file truncated)" : text;
        const ext = target.includes(".") ? target.split(".").pop().toLowerCase() : "txt";
        this.code?.release?.();
        this.code = codeState(body, LANG[ext] ?? ext);
        if (line) { const at = lineOffset(body, line); this.code.set_selected_range({ start: at, end: at }); }
      } catch (e) {
        if (this.target === target) this.error = String(e?.message ?? e);
      } finally {
        if (this.target === target) this.loading = false;
        cx.notify();
      }
    });
  }

  loadText(cx, poll) {
    const target = this.target;
    this.loading = true;
    cx.spawn(async (cx) => {
      try {
        const text = await readTextFile(target);
        if (this.target !== target) return;
        if (text == null) this.error = "File not found";
        else if (!poll || text !== this.text) { this.text = text; this.error = null; }
      } catch (e) {
        if (this.target === target) this.error = String(e?.message ?? e);
      } finally {
        if (this.target === target) this.loading = false;
        cx.notify();
      }
    });
  }

  runHelper(cx, script, args, done) {
    const target = this.target;
    this.loading = true;
    cx.notify();
    cx.spawn(async (cx) => {
      try {
        const r = await exec("node", [`${appHome()}/mods/viewer/${script}`, ...args], { timeout: CAPTURE_TIMEOUT_MS });
        if (this.target !== target) return;
        if (r.code !== 0) this.error = r.stderr.trim() || `${script} failed (${r.code})`;
        else { done(JSON.parse(r.stdout)); this.error = null; }
      } catch (e) {
        if (this.target === target) this.error = String(e?.message ?? e);
      } finally {
        if (this.target === target) this.loading = false;
        cx.notify();
      }
    });
  }

  loadImage(cx) {
    const dir = this.nextDir();
    this.runHelper(cx, "image.mjs", [this.target, dir.abs], (r) => { this.picture = { ...r, path: `${dir.rel}/${r.file}` }; });
  }

  capture(cx) {
    if (this.loading) return;
    const dir = this.nextDir();
    // shortcut: assumes a HiDPI (2x) screen since Herdr doesn't expose the scale factor; 1x screens just downsample.
    const scale = Math.min(3, 2 * (settings().zoom || 1));
    this.runHelper(cx, "capture.mjs", [this.target, dir.abs, String(Math.round(this.width - 14)), String(scale)], (r) => {
      this.page = { ...r, dir: dir.rel };
      this.title = r.title || null;
    });
  }

  showSource(on, cx) {
    this.code?.release?.();
    this.code = null;
    this.source = on;
    if (!on || !cx) return;
    const target = this.target;
    cx.spawn(async (cx) => {
      const text = await readTextFile(target).catch(() => null);
      if (this.target !== target || !this.source) return;
      this.code = codeState(text ?? "", "html");
      cx.notify();
    });
  }

  async close() {
    await exec("node", [`${appHome()}/mods/viewer/clean.mjs`, `${appHome()}/data/viewer/${this.id}`]);
  }

  body(t) {
    const scroll = () => v_flex().id("viewer-scroll").flex_1().min_h(0).overflow_y_scrollbar();
    const note = (text) => div().p(16).text_size(12).text_color(t.dim).child(text);
    if (!this.target) return note("Ctrl-click a file path or a web address in a terminal.");
    if (this.error) return note(this.error);
    if (this.source || this.kind === "text") {
      const font = settings();
      return this.code ? Editor.new(this.code).font_family(font.font_family).text_size(font.font_size).flex_1().min_h(0) : note("Loading…");
    }
    if (this.kind === "markdown") {
      return this.text == null ? note("Loading…")
        : scroll().px(24).py(16).child(TextView.markdown("viewer-md", this.text).selectable(true));
    }
    if (this.kind === "image") {
      const p = this.picture;
      if (!p) return note("Loading…");
      const w = fitWidth(p.width, this.width - 24);
      return scroll().p(12).items_center().child(image(p.path).w(w).h((p.height * w) / p.width).flex_none());
    }
    const pg = this.page;
    if (!pg) return note(this.loading ? "Capturing the page…" : "Waiting for the pane size…");
    const w = fitWidth(pg.width, this.width - 14);
    return scroll()
      .children(pg.tiles.map((tile) => image(`${pg.dir}/${tile.file}`).w(w).h((tile.height * w) / pg.width).flex_none()))
      .when(pg.truncated, (el) => el.child(note("The page is longer than 60,000 px; the rest was cut off.")));
  }

  render(cx) {
    const req = shared("viewer.show");
    if (req && req.n !== this.seen) {
      this.seen = req.n;
      // open() notifies, which Herdr forbids during render. Deferred via a timer: from inside cx.spawn, the helper never started (stuck on Loading).
      if (req.tab === this.tab) cx.timer.after(1, (cx) => this.open(req.target, req.kind, req.line, cx));
    }
    const t = theme();
    const button = (id, label, onClick) => div().id(id).h(24).px(8).flex().items_center().rounded(6).cursor_pointer()
      .text_color(t.muted).hover((s) => s.bg(t.hover)).on_click((_e, cx) => onClick(cx)).child(label);
    const isHtml = this.kind === "page" && this.local();
    return v_flex().id("viewer").size_full().min_h(0).bg(t.background).text_color(t.foreground).text_size(13)
      .on_size_change((size, cx) => {
        const first = !this.width;
        this.width = size.width;
        if (first && this.kind === "page" && !this.page) this.capture(cx);
        cx.notify();
      })
      .child(h_flex().h(36).flex_none().px(12).gap(6).items_center().border_b(1).border_color(t.border).text_size(12)
        .child(div().flex_1().min_w(0).truncate().text_color(t.foreground).child(this.title || (this.target ? nameOf(this.target) + (this.line ? `:${this.line}` : "") : "Viewer")))
        .when(this.kind === "page" && this.loading, (el) => el.child(div().text_color(t.dim).child("Capturing…")))
        .when(isHtml, (el) => el.child(button("viewer-source", this.source ? "Page" : "Source", (cx) => { this.showSource(!this.source, cx); cx.notify(); })))
        .when(this.kind === "page" && !this.source, (el) => el.child(button("viewer-refresh", "Refresh", (cx) => this.capture(cx))))
        .when(Boolean(this.target), (el) => el.child(button("viewer-open", this.kind === "page" ? "Browser" : "Open", () => {
          const [cmd, args] = opener(this.target);
          exec(cmd, args).catch(() => null);
        }))))
      .child(this.body(t));
  }
}
