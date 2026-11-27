# Changelog

Versions are git tags. The install and update prompts in the README take the latest one, the [`updates`](updates/RECIPE.md) mod announces new ones, and [`installed`](installed/RECIPE.md) shows which one each mod is at. Release with `scripts/release.sh <X.Y.Z>` after adding its section here.

## v0.1.1 — 2026-11-27

- `installed`: a `Not installed` section lists this repo's mods you don't have yet, each with an Install button (ctrl+i) that starts your agent to install it.
- The update prompt now lists the repo's mods you haven't installed and asks which to install, so new mods show up when you update.

## v0.1.0 — 2026-11-27

First version.

- Layouts: `all-in-one` (everything below, with a choice of keys) and `sysmon-status` (CPU / memory meter in the status bar, Linux).
- Mods: `inbox`, `recent`, `projects`, `viewer`, plus:
  - `updates`: a toast once a day when a newer version is out.
  - `installed`: a `Mods` row in the sidebar (and `alt-m`) opening the list of installed mods with their versions, layouts and keys. Update and Remove buttons start your agent in a new tab for that one mod. Mods from elsewhere are listed under `Other mods`, without buttons.
- `keymap`: the author's keys, to merge into yours.
- The install and update prompts fetch the latest version tag and record it in `.herdr-mods-version` (replacing `.herdr-mods-commit` from earlier installs).
