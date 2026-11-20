// Status-bar segment: CPU and memory of the machine running Herdr, from /proc every 2 s.
// Linux only: without /proc (macOS, Windows) it draws nothing.

import { View, div } from "gpui-kit";
import { h_flex } from "gpui-base";
import { theme, readTextFile } from "herdr";

const EVERY_MS = 2000;

export function cpuTimes(stat) {
  const f = stat.split("\n")[0].trim().split(/\s+/).slice(1).map(Number);
  return { idle: f[3] + (f[4] || 0), total: f.reduce((a, b) => a + b, 0) };
}

export function memUsage(meminfo) {
  const kb = (k) => Number(new RegExp(`^${k}:\\s+(\\d+)`, "m").exec(meminfo)?.[1] ?? 0);
  const total = kb("MemTotal");
  return { used: total - kb("MemAvailable"), total };
}

export default class SysMon extends View {
  init(_props, cx) {
    this.prev = null;
    this.cpu = null;
    this.mem = null;
    this.unsupported = false;
    cx.timer.every(EVERY_MS, (cx) => this.refresh(cx));
    this.refresh(cx);
  }

  refresh(cx) {
    cx.spawn(async (cx) => {
      const [stat, meminfo] = await Promise.all([readTextFile("/proc/stat"), readTextFile("/proc/meminfo")]);
      this.unsupported = !stat && !meminfo;
      if (stat) {
        const now = cpuTimes(stat);
        if (this.prev && now.total > this.prev.total) {
          this.cpu = 100 * (1 - (now.idle - this.prev.idle) / (now.total - this.prev.total));
        }
        this.prev = now;
      }
      if (meminfo) this.mem = memUsage(meminfo);
      cx.notify();
    });
  }

  render() {
    const t = theme();
    const level = (pct) => (pct >= 90 ? t.blocked : pct >= 75 ? t.foreground : t.muted);
    const gb = (kb) => (kb / 1048576).toFixed(1);
    const memPct = this.mem ? (100 * this.mem.used) / this.mem.total : null;
    if (this.unsupported) return h_flex().size_full().bg(t.chrome).border_t(1).border_color(t.border);
    const BAR = 48;
    const meter = (id, label, pct, text, textW) => h_flex().gap(6).items_center()
      .text_color(pct == null ? t.dim : level(pct))
      .child(label)
      .child(div().w(BAR).h(6).rounded(3).bg(t.border).overflow_hidden()
        .child(div().id(id).h_full().rounded(3).bg(pct == null ? t.dim : pct >= 90 ? t.blocked : t.accent)
          .w(pct == null ? 0 : Math.max(1, Math.round((BAR * Math.min(pct, 100)) / 100)))
          .transition("width", 400)))
      .child(div().w(textW).flex_none().text_right().child(text));
    return h_flex().size_full().px(12).gap(14).items_center().justify_end()
      .bg(t.chrome).border_t(1).border_color(t.border).text_size(11.8).text_color(t.muted)
      .child(meter("cpu-bar", "CPU", this.cpu, this.cpu == null ? "--" : `${Math.round(this.cpu)}%`, 32))
      .child(meter("mem-bar", "MEM", memPct, this.mem ? `${gb(this.mem.used)}/${gb(this.mem.total)}G` : "--", 68));
  }
}
