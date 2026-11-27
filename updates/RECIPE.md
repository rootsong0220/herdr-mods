# Updates

A toast when this repo has a newer version than the one installed. It only tells you: updating is still the update prompt in the [README](../README.md#updating), run by your agent.

## What you see

- Nothing in the layout: it is a 0px block.
- **The toast**, through Herdr's `notify` (level `info`, 20 s):
  - Title: `herdr-mods <new version> is out`.
  - Body: `You have <installed version>.` (or `Your installed version is unknown.`), then `Give your agent the update prompt from the README at github.com/rootsong0220/herdr-mods.`

## How it behaves

- **Versions** are the repo's git tags `vX.Y.Z`. The highest one is the latest; other tags (`v1.0.0-rc1`) are ignored.
- **Installed version:** `.herdr-mods-version` in this mod's own folder (`<Herdr home>/mods/updates/`), written by the install and update prompts. The update prompt updates every mod from this repo together, so this one file stands for all of them.
- **When it checks:** when the block loads, then every hour, but it asks GitHub at most once a day. A failed check (offline, no `git`) is retried the next hour.
- **When it tells you:** the latest tag is newer than the installed one, or the installed one is unknown (no file). Each version is announced once: a missed toast is not repeated until the next version.
- The state `{checkedAt, latest, installed, notified}` is kept in the shared value `updates.state`, which survives restarts.

## Built from

- **`mod.json`:** `place: "none"`, title `Updates`.
- **The block has to sit in the layout** as a 0px block, for example in the status bar next to `recent`'s:
  ```json
  { "id": "status-updates", "type": "block", "size": { "px": 0 }, "content": { "mod": "updates" } }
  ```
  If the status node is still a plain block, turn it into a row first, as [`recent`](../recent/RECIPE.md#built-from) shows.
- **`main.js`:** `init` returns at once under `checking()`. Otherwise it spawns a check, and `cx.timer.every(1 hour)` spawns one from the timer's own `cx`. `render` returns an empty `div()`.
- **The check:** `git ls-remote --tags --refs https://github.com/rootsong0220/herdr-mods.git` (20 s timeout). It uses git, not GitHub's API, because the API allows 60 calls an hour per IP address and an office shares one.
- **`versions.js`:** `latestTag(lsRemoteOutput)` and `newer(a, b)`, plain functions. `versions.test.mjs` next to `RECIPE.md` checks them: `node updates/versions.test.mjs`.
- **APIs used:** `herdr`: `exec`, `readTextFile`, `appHome()`, `notify`, `shared` / `setShared`, `checking()`.
- **What it reaches:** github.com, once a day, through `git`. It reads only its own `.herdr-mods-version` and writes only `updates.state`.

## Watch out

- **Without the 0px block, nothing checks.** A mod-only install has to add the block to the shown layout.
- **Renamed on install:** change `SELF` in `main.js` to the installed name (it locates `.herdr-mods-version`), the block's `mod`, and the shared key `updates.state`.
- **Forks:** change `REPO` and the toast's body to the fork's address.
- Needs `git` on PATH. Without it, it stays silent.
- Tested on Linux with Herdr 0.1.17. macOS and Windows are untested; `git` is the only program it runs.

## Done when

- `herdr-app check mods/updates` passes, and the shown layout has a 0px block with `mod: "updates"`.
- To test without waiting a day, temporarily change `KEY` in `main.js` to an unused name (saving reloads the mod):
  - With `v0.0.1` in `mods/updates/.herdr-mods-version`: a `herdr-mods <latest> is out` toast appears, saying `You have v0.0.1.`
  - With the latest version there, and `KEY` changed once more: no toast.
  - Put `KEY` back to `updates.state` and the latest version back in the file.
