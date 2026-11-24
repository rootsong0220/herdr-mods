**English** | [한국어](README.ko.md)

# keymap

The author's Herdr `keys.json`: vim-style pane moves on `alt-h/j/k/l`, a tmux-style `ctrl-b` prefix, `ctrl-1`…`9` for tabs, and keys for this repo's popups. This is not a gallery item. Install it by merging, not by copying over your file.

## Install

Give your agent this folder's URL, for example: "merge https://github.com/rootsong0220/herdr-mods/tree/main/keymap into my keys". It should:

1. Merge `keys.json` into the `keys.json` in your Herdr home (`~/.config/herdr-app`, or `$HERDR_APP_HOME`), following `AGENTS.md`. Add the new keys, and ask before replacing a key you already use. The table below lists the keys that replace one of Herdr's defaults.
2. Point `mod.open:<name>` at the installed names if `projects`, `inbox` or `recent` were installed under other names. If they aren't installed, those keys do nothing.
3. Leave out any key you decline.

Once you edit `keys.json`, Herdr stops updating it with new default shortcuts (see `AGENTS.md`).

## What changes from Herdr's defaults

### Replaces a default

| Key | Herdr default | This keymap |
|---|---|---|
| `alt-1` | `space.select:1` | `mod.open:projects` (needs [`projects`](../projects/RECIPE.md)) |
| `alt-2` | `space.select:2` | `mod.open:inbox` (needs [`inbox`](../inbox/RECIPE.md)) |
| `alt-3` … `alt-9` | `space.select:3` … `9` | left out of this file. A merge doesn't remove keys, so yours stay |
| `alt-up` / `alt-down` | `agent.prev` / `agent.next` | `pane.go:up` / `pane.go:down` |
| `ctrl-shift-l` | `layout.switch` | `pane.split:down` |

### Added

| Key | Action |
|---|---|
| `alt-shift-up` / `alt-shift-down` | `agent.prev` / `agent.next` (moved here from `alt-up`/`alt-down`) |
| `alt-shift-left` / `alt-shift-right` | `tab.prev` / `tab.next` |
| `alt-n` | `tab.rename` |
| `ctrl-shift-j` | `mod.open:projects` |
| `ctrl-shift-r` | `pane.split:right` |
| `ctrl-e` | `mod.open:recent` (needs [`recent`](../recent/RECIPE.md)) |
| `ctrl-n` | `tab.new` |
| `ctrl-b %` / `ctrl-b shift-5` | `pane.split:right` |
| `ctrl-b "` / `ctrl-b shift-'` | `pane.split:down` |
| `ctrl-b x` | `pane.close` |
| `ctrl-b &` / `ctrl-b shift-7` | `tab.close` |

Everything else in the file is the same as Herdr 0.1.17's defaults.

## Watch out

- **Keys taken from the shell and programs:** global keys win over the program in the terminal.
  - `ctrl-e` takes end-of-line away from every shell.
  - `ctrl-n` takes next-history (and "down" in many TUIs).
  - The `ctrl-b` chords take `ctrl-b` (back one character), and clash with tmux running inside Herdr.
  - If you want these keys in the shell, decline them, or move recent to `alt-e`, which is free in Herdr's defaults.
- **If you accept its replacement, `ctrl-shift-l` no longer switches layouts.** Switch from the command palette (`ctrl-shift-p`) or with `herdr-app do layout.switch`.
- On macOS, Option+digit types characters on many keyboard layouts, so `alt-1`/`alt-2` may not reach Herdr.
- Tested on Linux with Herdr 0.1.16–0.1.17.
