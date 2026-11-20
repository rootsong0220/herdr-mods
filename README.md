# herdr-mods

Mods and layouts for [Herdr](https://herdr.dev). Each folder is one entry. Its `RECIPE.md` is the brief to build it from scratch, and the files in the folder are one build of it.

| Folder | Kind | What it is |
|---|---|---|
| [`sysmon-status/`](sysmon-status/RECIPE.md) | layout | Shipped main layout plus a live CPU / memory meter in the status bar (Linux) |
| [`inbox/`](inbox/RECIPE.md) | mod | Keyboard-first popup of every agent, the ones that need you first (suggested key `alt-2`) |

To add one, give your agent the folder URL, for example "add https://github.com/rootsong0220/herdr-mods/tree/main/inbox":

- https://github.com/rootsong0220/herdr-mods/tree/main/sysmon-status
- https://github.com/rootsong0220/herdr-mods/tree/main/inbox

It follows the steps in `AGENTS.md` in your Herdr home (`~/.config/herdr-app`, or `$HERDR_APP_HOME`).
