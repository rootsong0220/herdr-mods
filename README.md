**English** | [한국어](README.ko.md)

# herdr-mods

Mods and layouts for [Herdr](https://herdr.dev). Each folder is one entry. Its `RECIPE.md` is the brief to build it from scratch, and the files in the folder are one build of it.

| Folder | Kind | What it is |
|---|---|---|
| [`all-in-one/`](all-in-one/RECIPE.md) | layout bundle | Everything below at once: main window with the CPU / memory meter, Inbox, Recent, Projects, Viewer, the update notice and the installed-mods list, with a choice of keys. Installs the mods from their own folders |
| [`sysmon-status/`](sysmon-status/RECIPE.md) | layout | Shipped main layout plus a live CPU / memory meter in the status bar |
| [`inbox/`](inbox/RECIPE.md) | mod | Keyboard-first popup of every agent, the ones that need you first (suggested key `alt-2`) |
| [`recent/`](recent/RECIPE.md) | mod | Recently visited tabs, most recent first; open and Enter flips between the last two (suggested key `ctrl-e`; it takes end-of-line from the shell, `alt-e` is the alternative). Needs a 0px block in your layout, see [Built from](recent/RECIPE.md#built-from) |
| [`projects/`](projects/RECIPE.md) | mod | One popup to switch spaces and open project folders: open spaces first, then the folders under your roots and pins (suggested keys `alt-1`, `ctrl-shift-j`) |
| [`keymap/`](keymap/README.md) | keys | The author's `keys.json` (vim-style pane moves, `ctrl-b` prefix, popup keys), to merge into yours. Not a gallery item |
| [`viewer/`](viewer/RECIPE.md) | mod | Ctrl/Cmd-click a path or web address in a terminal to see it in a pane beside it: code at the line, markdown, images, pages. Finds paths agents print relative to their repo. |
| [`updates/`](updates/RECIPE.md) | mod | A toast when a newer version of this repo is out (checked once a day). Needs a 0px block in your layout |
| [`installed/`](installed/RECIPE.md) | mod | A `Mods` row in the sidebar that opens the list of mods installed from this repo, with their versions and what uses them. Update or remove one with a button that starts your agent (suggested key `alt-m`) |

Versions and what changed in each: [`CHANGELOG.md`](CHANGELOG.md).

## Platforms and requirements

Everything was built and tested on Linux with Herdr 0.1.16–0.1.17. "Written for" means the code handles that OS but nobody has run it there yet.

| Folder | Linux | macOS | Windows | Herdr | Also needs |
|---|---|---|---|---|---|
| `all-in-one` | Install tested (not switched to live yet) | Written for (meter left out) | Written for (meter left out) | **0.1.17+** | What `viewer` needs |
| `keymap` | Tested | Mostly (`alt-1`/`alt-2` may type characters) | Keys are platform-neutral | 0.1.16+ | `projects`, `inbox`, `recent` for their keys |
| `sysmon-status` | Tested | No (the meter stays empty) | No (the meter stays empty) | 0.1.16+ | Nothing (reads `/proc`) |
| `inbox` | Tested | Written for | Written for | 0.1.16+ | Nothing |
| `recent` | Tested | Written for | Written for | 0.1.16+ | Nothing |
| `projects` | Tested | Written for | Written for | 0.1.16+ | Nothing; PowerShell on Windows for roots outside your home folder |
| `viewer` | Tested | Written for | Written for | **0.1.17+** (terminal link handlers) | Node 22+, `git`; Chrome, Chromium or Edge for web pages and `.html` |
| `updates` | Tested | Written for | Written for | 0.1.16+ | `git` |
| `installed` | Tested (list only) | Written for | Written for | 0.1.16+ | An agent CLI for the buttons (`claude` by default) |

## Installing

Open Claude Code (or another agent) inside Herdr and give it the prompt below, with the folder you want. `all-in-one` installs everything; any single folder works the same way.

```
Install https://github.com/rootsong0220/herdr-mods/tree/main/all-in-one into my Herdr.
- Use the latest version: the highest vX.Y.Z tag from `git ls-remote --tags --refs https://github.com/rootsong0220/herdr-mods.git`. Get it with `git clone --depth 1 --branch <tag>` into a temp folder. Without git, read the tags from https://api.github.com/repos/rootsong0220/herdr-mods/tags and download https://github.com/rootsong0220/herdr-mods/archive/refs/tags/<tag>.zip. Then follow AGENTS.md in my Herdr home (the folder with AGENTS.md) and the folder's RECIPE.md.
- First check the requirements in the RECIPE (Herdr version, Node, git, browser) and show me the result. If something is missing, ask me before installing.
- Don't overwrite anything. Back up keys.json as keys.json.bak-<date> before changing it.
- Use the keys suggested by each mod; if one is already in use, ask me instead of replacing it.
- Write the tag to .herdr-mods-version in each installed mod folder.
- If updates (the update notice) isn't among what you installed, ask whether to add it too, following updates/RECIPE.md.
- When done, run herdr-app check on each mod (if the herdr-app command isn't found, say so and skip it), switch to the new layout if there is one, and tell me what was installed, what was renamed, how to switch back and how to remove it all.
```

Folders:

- https://github.com/rootsong0220/herdr-mods/tree/main/all-in-one
- https://github.com/rootsong0220/herdr-mods/tree/main/keymap (merged into your keys; see its README)
- https://github.com/rootsong0220/herdr-mods/tree/main/sysmon-status
- https://github.com/rootsong0220/herdr-mods/tree/main/inbox
- https://github.com/rootsong0220/herdr-mods/tree/main/recent
- https://github.com/rootsong0220/herdr-mods/tree/main/projects
- https://github.com/rootsong0220/herdr-mods/tree/main/viewer
- https://github.com/rootsong0220/herdr-mods/tree/main/updates
- https://github.com/rootsong0220/herdr-mods/tree/main/installed

Each folder's `RECIPE.md` is written for the installing agent.

## Updating

Installed mods are copies: they don't update by themselves. The [`updates`](updates/RECIPE.md) mod tells you when a new version is out. Give your agent this:

```
Update what I installed from https://github.com/rootsong0220/herdr-mods to the latest version.
- Get the latest version tag the way the install prompt in its README does (a git clone of the tag, or the tag's zip). Don't read the repo through web pages or raw.githubusercontent.com (cached up to 5 minutes).
- Find what I installed from it in my Herdr home: the mods (inbox, recent, projects, viewer, sysmon, updates, installed, or the names they were installed under) and the layouts (all-in-one, sysmon-status).
- For each mod, compare its .herdr-mods-version (older installs have .herdr-mods-commit instead) with the tag, and diff every file against the repo folder. Don't call it up to date without a diff.
- For each layout, show me the diff against the repo's and ask before changing it. Keep blocks I added myself.
- If updates (the update notice) isn't installed, ask whether to install it, following updates/RECIPE.md.
- Replace the files that differ (this is an update, so overwriting is fine), but if I changed a file myself, show the difference and ask first. Redo the renames the recipe lists for mods installed under another name.
- Keep my data (projects.json, Recent's history). On Windows, rewrite projects.json entries starting with "~/" as full paths.
- Merge the keys from each keys.json; ask before replacing a key I use.
- Write the tag to .herdr-mods-version and delete .herdr-mods-commit. Run herdr-app check on each mod (skip it if the command isn't found), and list what changed, using CHANGELOG.md.
```
