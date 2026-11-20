// Recently visited tabs, most recent first. Two roles in one mod:
// - As a hidden 0px block in the layout: records each tab you look at in shared "recent.tabs"
//   (kept across restarts). Herdr has no visit time, so this block has to be in the layout.
// - As the overlay (mod.open:recent): lists tabs in that order with the cursor on the previous
//   one, so open + Enter flips between the last two tabs. Tabs not visited since follow in space order.
// Type to filter by tab, space or agent title; ↑/↓ Enter, Esc.

import { View, div, svg } from "gpui-kit";
import { v_flex, h_flex, InputState, Input, ScrollHandle } from "gpui-base";
import { spaces, agents, focused, run, theme, props, closeOverlay, shared, setShared } from "herdr";

const KEY = "recent.tabs";
const KEEP = 100;
const ROW = 32;

export default class Recent extends View {
  init(_props, cx) {
    this.picker = Boolean(props()?.overlay);
    if (!this.picker) return;
    this.filter = "";
    this.at = null;
    this.scroll = ScrollHandle.new();
    this.input = InputState.new({ placeholder: "Go to a recent tab…" });
    this.input.on("change", (_e, cx) => { this.filter = this.input.value(); this.at = 0; cx.notify(); });
    this.input.on("submit", () => this.go(this.rows()[this.at]));
    this.input.focus();
    cx.timer.after(600, () => this.input.focus());
    this.handle = cx.focus_handle();
  }

  // Tracker: re-rendered on every focus change; moves the shown tab to the front.
  track() {
    const tab = focused()?.tab;
    const list = shared(KEY) ?? [];
    if (!tab || list[0] === tab) return;
    setShared(KEY, [tab, ...list.filter((t) => t !== tab)].slice(0, KEEP));
  }

  rows() {
    const order = new Map((shared(KEY) ?? []).map((id, i) => [id, i]));
    const titles = new Map();
    for (const a of agents()) titles.set(a.tab, [...(titles.get(a.tab) ?? []), a.title].filter(Boolean));
    const all = spaces().flatMap((s, si) => s.tabs.map((t, ti) => ({ s, t, titles: titles.get(t.id) ?? [], pos: si * 1000 + ti })));
    const rank = (r) => (order.has(r.t.id) ? order.get(r.t.id) : KEEP + r.pos);
    const words = this.filter.toLowerCase().split(/\s+/).filter(Boolean);
    return all
      .filter((r) => words.every((w) => `${r.t.name} ${r.s.name} ${r.titles.join(" ")}`.toLowerCase().includes(w)))
      .sort((a, b) => rank(a) - rank(b));
  }

  go(r) {
    closeOverlay(props().overlay);
    if (r) run("tab.select", { id: r.t.id });
  }

  glyph(t, st) {
    if (st === "working") return svg("mods/workspace-chrome/spinner.svg").size(12).flex_none().text_color(t.working).spin(900);
    return div().w(12).flex_none().text_color(st ? (t[st] ?? t.dim) : t.dim).child(st === "blocked" || st === "done" ? "●" : "○");
  }

  render() {
    if (!this.picker) {
      this.track();
      return div();
    }
    const t = theme();
    const rows = this.rows();
    const current = focused()?.tab;
    // Opens on the previous tab (the one before the current), so Enter goes back.
    if (this.at === null) this.at = rows.length > 1 && rows[0].t.id === current ? 1 : 0;
    this.at = Math.min(this.at, Math.max(0, rows.length - 1));
    return v_flex()
      .id("recent")
      .track_focus(this.handle)
      .w_full()
      .min_h(0)
      .p(18)
      .gap(10)
      .bg(t.popover)
      .text_size(13)
      .on_key_down((e, cx) => {
        if (e.key === "escape") return closeOverlay(props().overlay);
        if (!rows.length || (e.key !== "down" && e.key !== "up")) return;
        this.at = (this.at + (e.key === "down" ? 1 : rows.length - 1)) % rows.length;
        this.scroll.scroll_to_item(this.at);
        cx.stop_propagation();
        cx.notify();
      })
      .child(div().text_size(15).font_semibold().text_color(t.foreground).child("Recent tabs"))
      .child(
        h_flex().h(36).flex_none().px(10).items_center().rounded(9).border_1().border_color(t.accent).bg(t.background)
          .child(Input.new(this.input).flex_1().h_full().text_size(12.8).text_color(t.foreground)),
      )
      .child(
        !rows.length
          ? div().h(30).text_color(t.dim).child("No tabs")
          // Popups size to content: the list needs a definite height or it collapses to 0.
          : v_flex().id("rc-list").h(Math.min(500, rows.length * ROW)).overflow_y_scrollbar().track_scroll(this.scroll).children(
            rows.map((r, i) =>
              h_flex().id(`rc-${i}`).flex_none().h(ROW).px(10).gap(10).items_center().rounded(7).cursor_pointer()
                .when(i === this.at, (el) => el.bg(t.hover))
                .hover((s) => s.bg(t.hover))
                .on_click(() => this.go(r))
                .child(this.glyph(t, r.t.status))
                .child(div().flex_none().max_w(220).truncate().text_color(t.foreground).when(r.t.id === current, (d) => d.font_semibold()).child(r.t.name))
                .child(div().flex_1().min_w(0).truncate().text_size(11.5).text_color(t.muted).child(r.titles.join(" · ")))
                .child(div().flex_none().text_size(11).text_color(t.dim).child(r.t.id === current ? `${r.s.name} · now` : r.s.name)))),
      )
      .child(div().text_size(11).text_color(t.dim).child("Enter go to tab · Esc"));
  }
}
