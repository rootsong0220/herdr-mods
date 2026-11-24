**English** | [한국어](README.ko.md)

# herdr-mods

Mods and layouts for [Herdr](https://herdr.dev). Each folder is one entry. Its `RECIPE.md` is the brief to build it from scratch, and the files in the folder are one build of it.

| Folder | Kind | What it is |
|---|---|---|
| [`sysmon-status/`](sysmon-status/RECIPE.md) | layout | Shipped main layout plus a live CPU / memory meter in the status bar |
| [`inbox/`](inbox/RECIPE.md) | mod | Keyboard-first popup of every agent, the ones that need you first (suggested key `alt-2`) |
| [`recent/`](recent/RECIPE.md) | mod | Recently visited tabs, most recent first; open and Enter flips between the last two (suggested key `alt-e`). Needs a 0px block in your layout, see [Built from](recent/RECIPE.md#built-from) |
| [`projects/`](projects/RECIPE.md) | mod | One popup to switch spaces and open project folders: open spaces first, then the folders under your roots and pins (suggested key `ctrl-shift-j`) |
| [`viewer/`](viewer/RECIPE.md) | mod | Ctrl/Cmd-click a path or web address in a terminal to see it in a pane beside it: code at the line, markdown, images, pages. Finds paths agents print relative to their repo. |

## Platforms and requirements

Everything was built and tested on Linux with Herdr 0.1.16–0.1.17. "Written for" means the code handles that OS but nobody has run it there yet.

| Folder | Linux | macOS | Windows | Herdr | Also needs |
|---|---|---|---|---|---|
| `sysmon-status` | Tested | No (the meter stays empty) | No (the meter stays empty) | 0.1.16+ | Nothing (reads `/proc`) |
| `inbox` | Tested | Written for | Written for | 0.1.16+ | Nothing |
| `recent` | Tested | Written for | Written for | 0.1.16+ | Nothing |
| `projects` | Tested | Written for | Written for | 0.1.16+ | Nothing; PowerShell on Windows for roots outside your home folder |
| `viewer` | Tested | Written for | Written for | **0.1.17+** (terminal link handlers) | Node 22+, `git`; Chrome, Chromium or Edge for web pages and `.html` |

To add one, give your agent the folder URL, for example "add https://github.com/rootsong0220/herdr-mods/tree/main/inbox":

- https://github.com/rootsong0220/herdr-mods/tree/main/sysmon-status
- https://github.com/rootsong0220/herdr-mods/tree/main/inbox
- https://github.com/rootsong0220/herdr-mods/tree/main/recent
- https://github.com/rootsong0220/herdr-mods/tree/main/projects
- https://github.com/rootsong0220/herdr-mods/tree/main/viewer

It follows the steps in `AGENTS.md` in your Herdr home (`~/.config/herdr-app`, or `$HERDR_APP_HOME`).
