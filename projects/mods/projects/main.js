// Switch spaces and open projects from one popup. Open spaces come first (cursor on the shown one),
// then candidates: each root, every folder directly under it, and pins.
// Roots and pins live in <Herdr home>/projects.json ({"roots": [...], "pins": [...]}, "~/" paths).
// Type to filter, ↑/↓ Enter to open, Esc to leave. "+ Add root" (ctrl+o) picks a folder; the selected
// row's buttons toggle its pin (ctrl+p) and root (ctrl+r).

import { View, div } from "gpui-kit";
import { v_flex, h_flex, InputState, Input, ScrollHandle } from "gpui-base";
import { appHome, checking, closeOverlay, exec, home, pickFolder, props, readTextFile, run, spaces, theme, writeTextFile } from "herdr";
import { readdir } from "fs/promises";

const SCAN_TIMEOUT_MS = 10000;

export const nameOf = (p) => p.split(/[\\/]/).filter(Boolean).pop() ?? p;
export const parentOf = (p) => p.split(/[\\/]/).slice(0, -1).join("/");

// "~/a/b" <-> "<home>/a/b", with the platform's separator on disk and "/" in projects.json.
export function expand(p, homeDir, sep) {
  return p === "~" ? homeDir : p.startsWith("~/") ? homeDir + sep + p.slice(2).split("/").join(sep) : p;
}
export function shorten(p, homeDir, sep) {
  return p === homeDir ? "~" : p.startsWith(homeDir + sep) ? "~/" + p.slice(homeDir.length + 1).split(sep).join("/") : p;
}

// The folders directly under `dir`, without hidden ones (.git, .cache: never projects). fs reads
// only inside the home folder, so other places are listed by the platform's own command.
async function subfolders(dir, sep) {
  try {
    return (await readdir(dir, { withFileTypes: true })).filter((e) => e.isDirectory() && !e.name.startsWith(".")).map((e) => dir + sep + e.name).sort();
  } catch {
    const r = sep === "\\"
      ? await exec("powershell", ["-NoProfile", "-Command", "Get-ChildItem -Directory -Force -LiteralPath $args[0] | ForEach-Object FullName", dir], { timeout: SCAN_TIMEOUT_MS }).catch(() => null)
      : await exec("find", [dir, "-mindepth", "1", "-maxdepth", "1", "-type", "d"], { timeout: SCAN_TIMEOUT_MS }).catch(() => null);
    return r && r.code === 0 ? r.stdout.split(/\r?\n/).filter((p) => p && !nameOf(p).startsWith(".")).sort() : null;
  }
}

export default class Projects extends View {
  init(_props, cx) {
    this.home = home();
    // window() is null outside a window (herdr-app check), so the home path tells the platform.
    this.sep = this.home.includes("\\") ? "\\" : "/";
    this.file = `${appHome()}/projects.json`;
    this.cfgText = null;
    this.cfg = { roots: [], pins: [] };
    this.dirs = null;
    this.error = "";
    this.filter = "";
    this.at = null;
    this.scroll = ScrollHandle.new();
    this.input = InputState.new({ placeholder: "Open a project…" });
    this.input.on("change", (_e, cx) => { this.filter = this.input.value(); this.at = 0; cx.notify(); });
    this.input.on("submit", () => this.open(this.rows()[this.at]));
    this.input.focus();
    this.handle = cx.focus_handle();
    if (checking()) return;
    // Opening the popup can take focus back from the first call.
    cx.timer.after(600, () => this.input.focus());
    cx.spawn(async (cx) => { await this.load(cx); });
  }

  abs(p) { return expand(p, this.home, this.sep); }
  rel(p) { return shorten(p, this.home, this.sep); }

  async load(cx) {
    this.cfgText = await readTextFile(this.file);
    try {
      const c = this.cfgText ? JSON.parse(this.cfgText) : {};
      const list = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === "string") : []);
      this.cfg = { roots: list(c.roots), pins: list(c.pins) };
      this.error = "";
    } catch (e) {
      this.error = `Can't read projects.json: ${e.message}`;
    }
    const found = [];
    for (const p of this.cfg.pins.map((x) => this.abs(x))) if (await subfolders(p, this.sep) !== null) found.push(p);
    for (const root of this.cfg.roots.map((x) => this.abs(x))) {
      const under = await subfolders(root, this.sep);
      if (under !== null) found.push(root, ...under);
    }
    this.dirs = [...new Set(found)];
    cx.notify();
  }

  // Toggles one path in roots or pins and saves; a file changed elsewhere since load is reloaded instead.
  save(key, path, cx) {
    const p = this.rel(path);
    const list = this.cfg[key];
    const next = { ...this.cfg, [key]: list.includes(p) ? list.filter((x) => x !== p) : [...list, p] };
    cx.spawn(async (cx) => {
      let failed = null;
      try {
        await writeTextFile(this.file, JSON.stringify(next, null, 2) + "\n", this.cfgText);
      } catch (e) {
        failed = `Not saved (projects.json changed elsewhere, reloaded): ${e.message}`;
      }
      await this.load(cx).catch((e) => { this.error = String(e?.message ?? e); });
      if (failed) { this.error = failed; cx.notify(); }
    });
  }

  addRoot(cx) {
    cx.spawn(async (cx) => {
      const f = await pickFolder({ prompt: "Add root" });
      if (f && !this.cfg.roots.map((p) => this.abs(p)).includes(f)) this.save("roots", f, cx);
    });
  }

  // Open spaces first (sidebar order), then candidate folders not already open.
  rows() {
    const words = this.filter.toLowerCase().split(/\s+/).filter(Boolean);
    const match = (s) => words.every((w) => s.toLowerCase().includes(w));
    const shown = spaces();
    const openFolders = new Set(shown.map((s) => s.folder));
    return [
      ...shown.filter((s) => match(`${s.name} ${s.folder}`)).map((s) => ({ space: s, path: s.folder })),
      ...(this.dirs ?? []).filter((p) => !openFolders.has(p) && match(p)).map((p) => ({ path: p })),
    ];
  }

  open(r) {
    closeOverlay(props().overlay);
    if (!r) return;
    const shown = r.space ?? spaces().find((s) => s.folder === r.path);
    if (shown) run("space.select", { id: shown.id });
    else run("space.new", { name: nameOf(r.path), folder: r.path, machine: "" });
  }

  render() {
    const t = theme();
    const rows = this.rows();
    // Opens on the shown space, so one ↑/↓ reaches the neighbouring space.
    if (this.at === null) this.at = Math.max(0, rows.findIndex((r) => r.space?.active));
    this.at = Math.min(this.at, Math.max(0, rows.length - 1));
    const sel = rows[this.at];
    const firstDir = rows.findIndex((r) => !r.space);
    const roots = new Set(this.cfg.roots.map((p) => this.abs(p)));
    const pins = new Set(this.cfg.pins.map((p) => this.abs(p)));
    // A press on a button must not reach the row under it (that would open the folder).
    const button = (id, label, key, act) => h_flex().id(id).flex_none().h(24).px(8).gap(6).items_center().rounded(6)
      .border_1().border_color(t.border).bg(t.background).text_size(11.5).text_color(t.foreground).cursor_pointer()
      .hover((s) => s.bg(t.raised))
      .on_mouse_down("left", (_e, cx) => cx.stop_propagation())
      .on_click((_e, cx) => { cx.stop_propagation(); act(cx); cx.notify(); })
      .child(label).child(div().text_size(10.5).text_color(t.dim).child(key));
    const actions = (p, i) => h_flex().gap(6).flex_none()
      .child(button(`pj-pin-${i}`, pins.has(p) ? "Unpin" : "Pin", "Ctrl+P", (cx) => this.save("pins", p, cx)))
      .child(button(`pj-root-${i}`, roots.has(p) ? "Remove root" : "Make root", "Ctrl+R", (cx) => this.save("roots", p, cx)));
    return v_flex()
      .id("projects")
      .track_focus(this.handle)
      .w_full()
      .min_h(0)
      .p(18)
      .gap(10)
      .bg(t.popover)
      .text_size(13)
      .on_key_down((e, cx) => {
        if (e.key === "escape") return closeOverlay(props().overlay);
        if (e.modifiers.control && e.key === "o") {
          this.addRoot(cx);
        } else if (e.modifiers.control && (e.key === "r" || e.key === "p")) {
          if (sel?.path) this.save(e.key === "r" ? "roots" : "pins", sel.path, cx);
        } else if (rows.length && (e.key === "down" || e.key === "up")) {
          this.at = (this.at + (e.key === "down" ? 1 : rows.length - 1)) % rows.length;
          this.scroll.scroll_to_item(this.at);
        } else return;
        cx.stop_propagation();
        cx.notify();
      })
      .child(h_flex().items_center().gap(10)
        .child(div().flex_1().text_size(15).font_semibold().text_color(t.foreground).child(`Spaces · projects  (${this.cfg.roots.length} roots, ${this.cfg.pins.length} pins)`))
        .child(button("pj-add-root", "+ Add root", "Ctrl+O", (cx) => this.addRoot(cx))))
      .child(
        h_flex().h(36).flex_none().px(10).items_center().rounded(9).border_1().border_color(t.accent).bg(t.background)
          .child(Input.new(this.input).flex_1().h_full().text_size(12.8).text_color(t.foreground)),
      )
      .when(!!this.error, (el) => el.child(div().text_size(11.5).text_color(t.blocked).child(this.error)))
      .child(
        !rows.length
          ? div().h(30).text_color(t.dim).child(this.dirs === null ? "Scanning…" : this.cfg.roots.length ? "No project matches" : "No roots yet: + Add root (Ctrl+O) to list your project folders")
          // Popups size to content: the list needs a definite height or it collapses to 0.
          : v_flex().id("pj-list").h(Math.min(480, rows.length * 30)).overflow_y_scrollbar().track_scroll(this.scroll).children(
            rows.map((r, i) => {
              const p = r.path;
              const row = h_flex().id(`pj-${i}`).flex_none().h(30).px(10).gap(10).items_center().rounded(7).cursor_pointer()
                .when(i === this.at, (el) => el.bg(t.hover))
                .when(i === firstDir && i > 0, (el) => el.border_t(1).border_color(t.border))
                .hover((s) => s.bg(t.hover))
                .on_click(() => this.open(r));
              if (r.space) {
                const st = r.space.status;
                return row
                  .child(div().w(12).flex_none().text_color(t.ansi2).child("●"))
                  .child(div().flex_1().truncate().text_color(t.foreground).when(r.space.active, (d) => d.font_semibold()).child(r.space.name))
                  .when(st === "blocked" || st === "done", (el) => el.child(div().text_size(11).text_color(t[st] ?? t.dim).child(st === "blocked" ? "Needs input" : "Done · unseen")))
                  .child(div().max_w(220).truncate().text_size(11).text_color(t.dim).child(`${r.space.tabs.length} tabs · ${this.rel(p ?? "")}`))
                  .when(i === this.at && !!p, (el) => el.child(actions(p, i)));
              }
              return row
                .child(div().w(12).flex_none().text_color(t.accent).child(pins.has(p) ? "★" : ""))
                .child(div().flex_1().truncate().text_color(t.foreground).child(nameOf(p)))
                .when(roots.has(p), (el) => el.child(div().text_size(10.5).px(5).rounded(4).border_1().border_color(t.border).text_color(t.dim).child("root")))
                .child(div().max_w(220).truncate().text_size(11).text_color(t.dim).child(parentOf(this.rel(p))))
                .when(i === this.at, (el) => el.child(actions(p, i)));
            })),
      )
      .child(div().text_size(11).text_color(t.dim).child(`${this.dirs === null ? "Scanning… · " : ""}↑↓ move · Enter open · Esc close`));
  }
}
