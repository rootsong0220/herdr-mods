# herdr-mods

Mods and layouts for [Herdr](https://herdr.dev). Each folder is one entry. Its `RECIPE.md` is the brief to build it from scratch, and the files in the folder are one build of it.

| Folder | Kind | What it is |
|---|---|---|
| [`sysmon-status/`](sysmon-status/RECIPE.md) | layout | Shipped main layout plus a live CPU / memory meter in the status bar (Linux) |
| [`inbox/`](inbox/RECIPE.md) | mod | Keyboard-first popup of every agent, the ones that need you first (`alt-2`) |

To add one, ask your agent to install `herdr.dev/layouts/<owner>/<name>` or `herdr.dev/mods/<owner>/<name>`, or point it at the folder. `~/.config/herdr-app/AGENTS.md` describes the steps.
