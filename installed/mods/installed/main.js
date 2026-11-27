// The mods installed from herdr-mods: every mod folder with a .herdr-mods-version (or the older
// .herdr-mods-commit), its version, and the layouts and keys that use it. Two roles in one mod:
// - As a layout block (the sidebar, above the shipped footer): a "Mods" row like Settings, with
//   "N behind" when mods are behind; it opens the popup.
// - As the popup (mod.open:installed): the list. The selected row's buttons start an agent in a new tab
//   to update (ctrl+u) or remove (ctrl+d) that one mod. Both need the judgment the README's prompts
//   describe (renamed copies, edited files, layouts), so this only asks.

import { View, div, svg } from "gpui-kit";
import { v_flex, h_flex, ScrollHandle } from "gpui-base";
import { appHome, checking, closeOverlay, exec, layout, layouts, props, readTextFile, run, shared, theme } from "herdr";
import { readdir } from "fs/promises";
import { newer } from "./versions.js";

const REPO = "https://github.com/rootsong0220/herdr-mods";
const SELF = "installed";
const RESCAN_MS = 5 * 60 * 1000;
const ROW = 44;
const HEAD = 28;
const DEFAULT_AGENT = ["claude"];
// installed.json is Herdr's own bookkeeping of its shipped mods; never write there.
const CONFIG = "herdr-mods.json";
// Mods this repo provides. A folder with one of these names but no version file was installed by hand.
const KNOWN = new Set(["inbox", "recent", "projects", "viewer", "sysmon", "updates", "installed"]);

const read = (path) => readTextFile(path).catch(() => null);
const json = (text) => { try { return JSON.parse(text); } catch { return null; } };

async function modNames(dir) {
  try {
    return (await readdir(dir, { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    // fs reads only inside the home folder, and Herdr's home can be outside it on Windows.
    const win = /^[A-Za-z]:/.test(dir);
    const literal = "'" + dir.replace(/['‘’‚‛]/g, "$&$&") + "'";
    const r = await (win
      ? exec("powershell", ["-NoProfile", "-Command", "[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false); " +
        `Get-ChildItem -LiteralPath ${literal} -Directory -Force -ErrorAction Stop | ForEach-Object { $_.Name }`], { timeout: 10000 })
      : exec("find", [dir, "-mindepth", "1", "-maxdepth", "1", "-type", "d"], { timeout: 10000 })).catch(() => null);
    return r && r.code === 0 ? r.stdout.split(/\r?\n/).filter(Boolean).map((p) => p.split(/[\\/]/).pop()) : [];
  }
}

// Mod names a layout uses: blocks' content.mod, link_handlers, and the root's toast and terminal_menu.
function modsInLayout(node, out = new Set()) {
  if (!node || typeof node !== "object") return out;
  if (typeof node.content?.mod === "string") out.add(node.content.mod);
  for (const k of ["toast", "terminal_menu"]) if (typeof node[k] === "string") out.add(node[k]);
  for (const h of node.link_handlers ?? []) out.add(h);
  for (const c of node.children ?? []) modsInLayout(c, out);
  return out;
}

// Keys bound to a mod: "mod.open:<name>" or one of its own "<name>:<command>"s, in any section.
function keysFor(keys, name) {
  const found = [];
  for (const section of Object.values(keys ?? {})) {
    if (!section || typeof section !== "object") continue;
    for (const [key, action] of Object.entries(section)) {
      if (action === `mod.open:${name}` || (typeof action === "string" && action.startsWith(`${name}:`))) found.push(key);
    }
  }
  return found;
}

async function scan() {
  const home = appHome();
  const cfg = json(await read(`${home}/${CONFIG}`));
  const agent = Array.isArray(cfg?.agent) && cfg.agent.length && cfg.agent.every((a) => typeof a === "string") ? cfg.agent : DEFAULT_AGENT;
  const keys = json(await read(`${home}/keys.json`));
  const used = new Map();
  for (const l of layouts()) {
    for (const mod of modsInLayout(json(await read(`${home}/layouts/${l}.json`)))) used.set(mod, [...(used.get(mod) ?? []), l]);
  }
  // Herdr's record of its shipped mods. Unreadable: list only this repo's, rather than every shipped one as "other".
  const shipped = json(await read(`${home}/installed.json`));
  const mods = [], others = [];
  for (const name of (await modNames(`${home}/mods`)).sort()) {
    const tag = (await read(`${home}/mods/${name}/.herdr-mods-version`))?.trim();
    const commit = tag ? null : (await read(`${home}/mods/${name}/.herdr-mods-commit`))?.trim();
    const uses = { layouts: used.get(name) ?? [], keys: keysFor(keys, name) };
    if (tag || commit || KNOWN.has(name)) {
      mods.push({ name, version: tag || (commit ? `commit ${commit.slice(0, 7)}` : "version unknown"), tagged: !!tag, ...uses });
    } else if (shipped && typeof shipped === "object" && !Object.prototype.hasOwnProperty.call(shipped, name)) {
      others.push({ name, version: "not from herdr-mods", other: true, ...uses });
    }
  }
  return { agent, mods: [...mods, ...others] };
}

// As the shipped sidebar decides it: a rail when the sidebar is under 160px.
function narrow(node = layout()) {
  if (node?.id === "sidebar") return (node.size?.px ?? Infinity) < 160;
  for (const c of node?.children ?? []) { const r = narrow(c); if (r !== undefined) return r; }
  return undefined;
}

const isBehind = (m, latest) => !m.other && (!m.tagged || (!!latest && newer(latest, m.version)));

const updatePrompt = (m) =>
  `Update only the "${m.name}" mod in my Herdr home (${appHome()}) to the latest version of ${REPO} (installed: ${m.version}). ` +
  `Get the repo and follow the update prompt in its README.md ("Updating"), applied to this one mod: its files, ` +
  `the renames its RECIPE.md lists if it was installed under another name, its keys, and the layout blocks it needs. Leave the other mods as they are.`;

const removePrompt = (m) =>
  `Remove the "${m.name}" mod from my Herdr home (${appHome()}). It was installed from ${REPO} (version ${m.version}). ` +
  `Read its RECIPE.md in that repo to find everything it added, then show me the list: the mods/${m.name} folder; ` +
  `layout blocks with "mod": "${m.name}" and "${m.name}" in link_handlers (${m.layouts.join(", ") || "no layout uses it"}); ` +
  `keys.json bindings to it (${m.keys.join(", ") || "none found"}); and its data and shared keys named in the RECIPE. ` +
  `Ask me before deleting anything, and back up keys.json and each layout you change as <file>.bak-<date> first. ` +
  `Don't touch other mods. When done, tell me how to install it again.`;

export default class Installed extends View {
  init(_props, cx) {
    this.popup = Boolean(props()?.overlay);
    this.mods = null;
    this.at = 0;
    this.agent = DEFAULT_AGENT;
    const load = (cx) => cx.spawn(async (cx) => { Object.assign(this, await scan()); cx.notify(); });
    load(cx);
    if (!this.popup) {
      // Spawn from the timer's own cx: a spawn nested inside another task never runs.
      if (!checking()) cx.timer.every(RESCAN_MS, (cx) => load(cx));
      return;
    }
    this.scroll = ScrollHandle.new();
    this.handle = cx.focus_handle();
    this.handle.focus();
    cx.timer.after(600, () => this.handle.focus());
  }

  // Styled like the shipped sidebar footer's rows (Settings, Add machine), so it reads as one of them.
  bar(t, latest) {
    const n = (this.mods ?? []).filter((m) => isBehind(m, latest)).length;
    const rail = narrow() === true;
    const dot = div().size(6).rounded_full().bg(t.accent);
    const row = h_flex().id("installed-bar").h(28).px(8).gap(9).items_center().rounded(8).cursor_pointer()
      .text_color(t.muted).hover((s) => s.bg(t.hover).text_color(t.foreground))
      .on_click(() => run("mod.open", { name: SELF }))
      .child(svg("mods/workspace-chrome/layers.svg").size(14))
      .when(rail, (el) => el.relative().w(32).px(0).justify_center().when(n > 0, (el) => el.child(dot.absolute().top(5).right(6))))
      .when(!rail, (el) => el.child(div().flex_1().child("Mods"))
        .when(n > 0, (el) => el.child(div().text_size(11).text_color(t.accent).child(`${n} behind`))));
    return v_flex().size_full().bg(t.chrome).border_t(1).border_color(t.border).px(8).pt(4).text_size(13)
      .when(rail, (el) => el.px(0).items_center())
      .child(row);
  }

  ask(m, prompt, label) {
    closeOverlay(props().overlay);
    if (m) run("terminal.open", { argv: [...this.agent, prompt(m)], folder: appHome(), place: "tab", name: `${label} ${m.name}` });
  }

  render() {
    const t = theme();
    const latest = shared("updates.state")?.latest ?? null;
    if (!this.popup) return this.bar(t, latest);
    const mods = this.mods ?? [];
    this.at = Math.min(this.at, Math.max(0, mods.length - 1));
    const behind = (m) => isBehind(m, latest);
    const button = (id, label, key, act) => h_flex().id(id).flex_none().h(24).px(8).gap(6).items_center().rounded(6)
      .border_1().border_color(t.border).bg(t.background).text_size(11.5).text_color(t.foreground).cursor_pointer()
      .hover((s) => s.bg(t.raised))
      .on_mouse_down("left", (_e, cx) => cx.stop_propagation())
      .on_click((_e, cx) => { cx.stop_propagation(); act(); })
      .child(label).child(div().text_size(10.5).text_color(t.dim).child(key));
    // Other mods have no source to update from or recipe to remove by: listed only.
    const update = (m) => m && !m.other && this.ask(m, updatePrompt, "update");
    const remove = (m) => m && !m.other && this.ask(m, removePrompt, "remove");
    const firstOther = mods.findIndex((m) => m.other);
    const headed = (i) => i + (firstOther >= 0 && i >= firstOther ? 1 : 0);
    return v_flex()
      .id("installed")
      .track_focus(this.handle)
      .w_full()
      .min_h(0)
      .p(18)
      .gap(10)
      .bg(t.popover)
      .text_size(13)
      .on_key_down((e, cx) => {
        if (e.key === "escape") return closeOverlay(props().overlay);
        if (e.modifiers.control && e.key === "u") update(mods[this.at]);
        else if (e.modifiers.control && e.key === "d") remove(mods[this.at]);
        else if (mods.length && (e.key === "down" || e.key === "up")) {
          this.at = (this.at + (e.key === "down" ? 1 : mods.length - 1)) % mods.length;
          this.scroll.scroll_to_item(headed(this.at));
        } else return;
        cx.stop_propagation();
        cx.notify();
      })
      .child(h_flex().items_center().gap(10)
        .child(div().flex_1().text_size(15).font_semibold().text_color(t.foreground).child("Installed mods"))
        .child(div().text_size(11.5).text_color(t.dim).child(latest ? `latest ${latest}` : "latest unknown (needs the updates mod)")))
      .child(
        !mods.length
          ? div().h(30).text_color(t.dim).child(this.mods === null ? "Scanning…" : "No mods found")
          // Popups size to content: the list needs a definite height or it collapses to 0.
          : v_flex().id("in-list").h(Math.min(480, mods.length * ROW + (firstOther >= 0 ? HEAD : 0))).overflow_y_scrollbar().track_scroll(this.scroll).children(
            mods.flatMap((m, i) => {
              const head = i === firstOther
                ? [h_flex().id("in-others").flex_none().h(HEAD).px(10).items_end().pb(4).gap(6).text_size(11).font_semibold().text_color(t.dim)
                  .when(i > 0, (el) => el.border_t(1).border_color(t.border))
                  .child("Other mods").child(div().font_weight(400).child("· not from herdr-mods, so no version or buttons"))]
                : [];
              const uses = [m.layouts.length ? `layout ${m.layouts.join(", ")}` : "", m.keys.length ? `keys ${m.keys.join(", ")}` : ""].filter(Boolean).join(" · ");
              return [...head, h_flex().id(`in-${i}`).flex_none().h(ROW).px(10).gap(10).items_center().rounded(7).cursor_pointer()
                .when(i === this.at, (el) => el.bg(t.hover))
                .hover((s) => s.bg(t.hover))
                .on_click((_e, cx) => { this.at = i; cx.notify(); })
                .child(v_flex().flex_1().min_w(0).gap(2)
                  .child(h_flex().gap(8).items_center()
                    .child(div().font_semibold().text_color(t.foreground).child(m.name))
                    .child(div().text_size(11).text_color(t.dim).child(m.other ? "" : m.version))
                    .when(behind(m), (el) => el.child(div().text_size(11).text_color(t.accent).child(m.tagged ? `→ ${latest}` : "not tracked"))))
                  .child(div().truncate().text_size(11).text_color(t.dim).child(uses || "not used by any layout or key")))
                .when(i === this.at && !m.other, (el) => el.child(h_flex().gap(6).flex_none()
                  .child(button(`in-up-${i}`, "Update", "Ctrl+U", () => update(m)))
                  .child(button(`in-rm-${i}`, "Remove", "Ctrl+D", () => remove(m)))))];
            }),
          ),
      )
      .child(div().text_size(11).text_color(t.dim).child("↑↓ move · Update and Remove start your agent in a new tab · Esc close"));
  }
}
