# Changelog

Versions are git tags. The install and update prompts in the README take the latest one, and the [`updates`](updates/RECIPE.md) mod announces new ones. Release with `scripts/release.sh <X.Y.Z>` after adding its section here.

## v0.3.0 — 2026-11-27

- New [`installed`](installed/RECIPE.md) mod (`alt-m`): the mods installed from this repo with their versions, layouts and keys. Its Update and Remove buttons start your agent in a new tab to update or remove that one mod. `all-in-one` includes it.

## v0.2.0 — 2026-11-27

- New [`updates`](updates/RECIPE.md) mod: a toast once a day when a newer version is out. `all-in-one` includes it.
- The install and update prompts fetch the latest version tag instead of `main`, and record it in `.herdr-mods-version` (replacing `.herdr-mods-commit`). The update prompt also updates installed layouts and offers to install `updates`.

## v0.1.0 — 2026-11-27

- First tagged version: `all-in-one`, `sysmon-status`, `inbox`, `recent`, `projects`, `viewer` and `keymap`.
- `viewer`: Ctrl-clicking another file while a viewer is open replaces its content instead of showing a render error.
