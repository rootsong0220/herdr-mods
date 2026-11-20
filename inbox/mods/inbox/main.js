// Agents that need you, then the rest; Enter goes to that pane.
// blocked = waiting for input, done = finished while you weren't looking (turns idle once seen).
// ↑/↓ Enter, Esc. Type to filter by title, space or tab.

import { View, div, svg } from "gpui-kit";
import { v_flex, h_flex, InputState, Input, ScrollHandle } from "gpui-base";
import { agents, run, theme, props, closeOverlay } from "herdr";

const RANK = { blocked: 0, done: 1 };
const LABEL = { blocked: "Needs input", done: "Done · unseen", working: "Working", idle: "Idle" };
const ROW = 32;
const HEAD = 26;

export default class Inbox extends View {
  init(_props, cx) {
    this.filter = "";
    this.at = 0;
    this.scroll = ScrollHandle.new();
    this.input = InputState.new({ placeholder: "Filter agents…" });
    this.input.on("change", (_e, cx) => { this.filter = this.input.value(); this.at = 0; cx.notify(); });
    this.input.on("submit", () => this.go(this.rows()[this.at]));
    this.input.focus();
    cx.timer.after(600, () => this.input.focus());
    this.handle = cx.focus_handle();
  }

  rows() {
    const words = this.filter.toLowerCase().split(/\s+/).filter(Boolean);
    const all = agents().filter((a) => words.every((w) => `${a.title} ${a.space_name} ${a.tab_name}`.toLowerCase().includes(w)));
    const hot = all.filter((a) => a.status in RANK).sort((a, b) => RANK[a.status] - RANK[b.status] || b.seq - a.seq);
    const rest = all.filter((a) => !(a.status in RANK)).sort((a, b) => b.seq - a.seq);
    return [...hot, ...rest];
  }

  go(a) {
    closeOverlay(props().overlay);
    if (a) run("agent.focus", { terminal: a.address });
  }

  glyph(t, st) {
    if (st === "working") return svg("mods/workspace-chrome/spinner.svg").size(12).flex_none().text_color(t.working).spin(900);
    return div().w(12).flex_none().text_color(t[st] ?? t.dim).child(st === "idle" ? "○" : "●");
  }

  badge(t, st, strong) {
    const c = t[st] ?? t.dim;
    return div().flex_none().px(7).py(1).rounded(10).text_size(10.5).font_semibold()
      .border_1().border_color(c).text_color(strong ? t.popover : c).when(strong, (d) => d.bg(c))
      .child(LABEL[st] ?? st);
  }

  head(t, text, count) {
    return h_flex().flex_none().h(HEAD).px(10).items_end().pb(4).gap(6).text_size(11).font_semibold().text_color(t.dim)
      .child(text).child(div().text_color(t.muted).child(String(count)));
  }

  render() {
    const t = theme();
    const rows = this.rows();
    this.at = Math.min(this.at, Math.max(0, rows.length - 1));
    const hot = rows.filter((a) => a.status in RANK).length;
    const heads = (hot ? 1 : 0) + (rows.length > hot ? 1 : 0);
    const items = [];
    rows.forEach((a, i) => {
      if (i === 0 && hot) items.push(this.head(t, "Needs you", hot));
      if (i === hot) items.push(this.head(t, "Other agents", rows.length - hot));
      const urgent = a.status in RANK;
      items.push(
        h_flex().id(`ib-${i}`).flex_none().h(ROW).px(10).gap(10).items_center().rounded(7).cursor_pointer()
          .when(urgent, (el) => el.border_l(3).border_color(t[a.status] ?? t.accent))
          .when(i === this.at, (el) => el.bg(t.hover))
          .hover((s) => s.bg(t.hover))
          .on_click(() => this.go(a))
          .child(this.glyph(t, a.status))
          .child(div().flex_1().truncate().text_color(urgent ? t.foreground : t.muted).when(urgent, (d) => d.font_semibold())
            .child(a.title || a.program?.name || a.address))
          .child(this.badge(t, a.status, urgent))
          .child(div().w(190).flex_none().truncate().text_size(11).text_color(t.dim).child(`${a.space_name} / ${a.tab_name}`)),
      );
    });
    return v_flex()
      .id("inbox")
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
        this.scroll.scroll_to_item(this.at + (hot && this.at >= 0 ? 1 : 0) + (this.at >= hot && rows.length > hot ? 1 : 0));
        cx.stop_propagation();
        cx.notify();
      })
      .child(
        h_flex().items_center().gap(8)
          .child(div().text_size(15).font_semibold().text_color(t.foreground).child("Inbox"))
          .child(hot
            ? div().px(8).py(1).rounded(10).text_size(11).font_semibold().bg(t.blocked ?? t.accent).text_color(t.popover).child(`Needs you ${hot}`)
            : div().text_size(11.5).text_color(t.dim).child("Nothing waiting")),
      )
      .child(
        h_flex().h(36).flex_none().px(10).items_center().rounded(9).border_1().border_color(t.accent).bg(t.background)
          .child(Input.new(this.input).flex_1().h_full().text_size(12.8).text_color(t.foreground)),
      )
      .child(
        !rows.length
          ? div().h(30).text_color(t.dim).child("No agents")
          // Popups size to content: the list needs a definite height or it collapses to 0.
          : v_flex().id("ib-list").h(Math.min(500, rows.length * ROW + heads * HEAD)).overflow_y_scrollbar().track_scroll(this.scroll).children(items),
      )
      .child(div().text_size(11).text_color(t.dim).child("Enter go to pane · Esc"));
  }
}
