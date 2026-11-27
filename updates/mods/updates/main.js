// Update notice for herdr-mods. Lives in the layout as a hidden 0px block: once a day it asks
// GitHub for the repo's version tags and posts a toast when one is newer than what was installed.
// It only tells; updating stays the README's update prompt, run by the person's agent.

import { View, div } from "gpui-kit";
import { exec, appHome, readTextFile, notify, shared, setShared, checking } from "herdr";
import { latestTag, newer } from "./versions.js";

const REPO = "https://github.com/rootsong0220/herdr-mods.git";
const SELF = "updates";
const KEY = "updates.state";
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

async function check() {
  const state = shared(KEY) ?? {};
  if (Date.now() - (state.checkedAt ?? 0) < DAY_MS) return;
  // ls-remote reads tags without GitHub's API, whose 60 calls/hour are per IP: a whole office shares one.
  const r = await exec("git", ["ls-remote", "--tags", "--refs", REPO], { timeout: 20000 }).catch(() => null);
  if (!r || r.code !== 0) return; // offline or no git: try again next hour
  const latest = latestTag(r.stdout);
  const installed = (await readTextFile(`${appHome()}/mods/${SELF}/.herdr-mods-version`).catch(() => null))?.trim() || null;
  let notified = state.notified ?? null;
  if (latest && latest !== notified && (!installed || newer(latest, installed))) {
    notify({
      title: `herdr-mods ${latest} is out`,
      body: `${installed ? `You have ${installed}.` : "Your installed version is unknown."} Give your agent the update prompt from the README at github.com/rootsong0220/herdr-mods.`,
      level: "info",
      timeout: 20000,
    });
    notified = latest;
  }
  setShared(KEY, { checkedAt: Date.now(), latest, installed, notified });
}

export default class Updates extends View {
  init(_props, cx) {
    if (checking()) return;
    cx.spawn(async () => check());
    // Spawn from the timer's own cx: a spawn nested inside another task never runs.
    cx.timer.every(HOUR_MS, (cx) => cx.spawn(async () => check()));
  }

  render() {
    return div();
  }
}
