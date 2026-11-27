# Installed

A popup listing the mods installed from this repo, with their version and what uses them. The selected row's buttons update or remove that one mod by starting your agent in a new tab with the right prompt.

## What you see

- A popup at the top of the window, 40px down, 640px wide, up to 80% of the window height. Its background is `popover`, with 18px padding, a 10px gap and 13px text.
- **Header:** `Installed mods` (15px, semibold, `foreground`), and on the right `latest <tag>` (11.5px, `dim`), or `latest unknown (needs the updates mod)`.
- **Rows** are 44px tall, radius 7, 10px side padding, one per mod, sorted by name:
  - First line: the mod's folder name (semibold, `foreground`), its version in 11px `dim` (`v0.2.0`, or `commit abc1234` for installs from before version tags), then in 11px `accent` either `→ <latest>` when a newer tag is out, or `older install` for a commit-only install.
  - Second line (11px, `dim`, truncated): `layout <names> · keys <keys>`, or `not used by any layout or key`.
  - **The selected row** ends with two buttons: `Update` (`Ctrl+U`) and `Remove` (`Ctrl+D`). They look like [`projects`](../projects/RECIPE.md)' buttons.
  - The selected row and the hovered row have the `hover` background.
- `Scanning…` while it reads, `No mods from herdr-mods found` when there are none.
- **Footer** (11px, `dim`): `↑↓ move · Update and Remove start your agent in a new tab · Esc close`.

## How it behaves

- **Which mods:** every folder in `<Herdr home>/mods/` with a `.herdr-mods-version` file (written by the README's install and update prompts), or the older `.herdr-mods-commit`. Copies installed under another name are found too. Herdr's own mods have neither file and are left out.
- **What uses a mod:** for every layout in `layouts()`, the blocks with `content.mod` equal to its name and its name in `link_handlers`. For `keys.json`, any binding to `mod.open:<name>` or to one of its own `<name>:<command>`s.
- **Latest version:** the `latest` that the [`updates`](../updates/RECIPE.md) mod keeps in the shared value `updates.state`. It is at most a day old. Without `updates`, nothing is marked as behind except commit-only installs.
- **Update / Remove** (button, or ctrl+u / ctrl+d on the selected row) close the popup and run `terminal.open {argv: [...agent, prompt], folder: <Herdr home>, place: "tab", name: "update <mod>"}`:
  - **Update:** update only this mod to the repo's latest version, following the README's update prompt for it: its files, the renames from its recipe if it was renamed, its keys and the layout blocks it needs.
  - **Remove:** read the mod's recipe, list everything it added (its folder, layout blocks and `link_handlers` entries, keys, data and shared keys), ask before deleting, and back up `keys.json` and each changed layout first.
  - The agent asks its questions in that tab. Nothing is changed before it does.
- **The agent:** `["claude"]`. To use another one, write `<Herdr home>/installed.json`: `{ "agent": ["codex"] }`. The prompt is passed as the last argument.
- ↑/↓ move and wrap. A click selects a row. Esc closes the popup.
- **Opening:** `alt-m` (from `keys.json`). Without that key, use `mod.open {"name":"installed"}`.

## Built from

- **`mod.json`:** `place: "none"`, title `Installed mods`, and the overlay `{ "kind": "popup", "at": "top", "offset": 40, "width": 640, "height": 0.8 }`.
- **Listing `mods/`:** `readdir` from the mod's `fs/promises`. It reads only inside the home folder, and Herdr's home can be outside it on Windows, so on failure it runs PowerShell (`Get-ChildItem -LiteralPath '<dir>' -Directory`, the path quoted inside the script as in `projects`) or `find`.
- **`versions.js`:** the same file as in `updates` (`newer(a, b)`), copied so each mod stands alone.
- **Focus:** there is no input, so `init` focuses the view's own `focus_handle()`, and again 600ms later.
- **APIs used:** `herdr`: `appHome()`, `layouts()`, `readTextFile`, `exec` (only for the listing fallback), `run("terminal.open")`, `shared("updates.state")`, `props().overlay`, `closeOverlay`, `theme()`. `gpui-base`: `ScrollHandle`.
- **`keys.json`:** `{ "global": { "alt-m": "mod.open:installed" } }`.
- **What it reaches:** no network. It reads `mods/*/.herdr-mods-version`, `.herdr-mods-commit`, `layouts/*.json`, `keys.json` and `installed.json`. The agent it starts reaches GitHub and changes files, after asking.

## Watch out

- **Renamed on install:** the key must point at the installed name.
- **Forks:** change `REPO` in `main.js`.
- `ctrl-m` would be a poor key for it: terminals send ctrl+m as Enter. `alt-m` is free in Herdr's defaults, but Claude Code uses Alt+M as a second key for switching permission modes (Shift+Tab still works).
- The agent must be on PATH for the terminal Herdr starts. If it isn't, the new tab shows the error.
- Updating one mod at a time can leave mods at different versions. `updates` compares only its own `.herdr-mods-version`, so it stays quiet once it is current even if others are behind; this list shows each one.
- Tested on Linux with Herdr 0.1.17: the list, versions, layouts and keys. The buttons' agent runs weren't exercised in tests. macOS and Windows are untested.

## Done when

- `herdr-app check mods/installed` passes.
- `alt-m` opens the popup with every installed mod from this repo, each with its version, layouts and keys.
- Write `v0.0.1` into one mod's `.herdr-mods-version`: with `updates` installed and checked, that row shows `→ <latest>`. Put the real version back.
- Select a row and press `Update`: a new tab named `update <mod>` starts the agent with the update prompt for that mod, and the popup closes. Answer no to its questions to leave everything as it was.
