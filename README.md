# Hosts Editor 2.0

A ground-up rewrite of Hosts Editor 1.2.x using Electron + React + Vite + strict TypeScript + Tailwind CSS.

## Preserved from 1.x

- Structured per-entry editing, enable/disable via comments, add/remove entries.
- Raw text editing.
- Search in structured view; raw editor has its own find box with next/previous matches.
- Save/apply, reset/import system hosts, light/dark/system appearance, fullscreen, splash screen and update checks.

## 2.0 additions

- Multiple JSON-backed tabs.
- Automatic JSON backup before each tab overwrite.
- System hosts recovery backup before every apply.
- Safe temporary-file based writes; an empty generated hosts file is rejected.
- Backups are normal JSON files and can be opened in Finder / Explorer / Linux file manager.
- macOS, Windows and Linux adapters are isolated from renderer code.
- Strict TypeScript; no `any` in application source.
- Yarn Berry with a normal `node_modules` tree (`nodeLinker: node-modules`).

## Install

Requires Node 24+ recommended.

```bash
corepack enable
yarn install
yarn dev
```

## Build

```bash
yarn build
yarn dist:mac   # macOS
yarn dist:win   # Windows
yarn dist:linux # Linux
```

Build installers on their target OS or push a `vX.Y.Z` tag and use the GitHub Actions workflow.

## Data

Electron userData contains `v2/tabs`, `v2/backups`, `v2/system-backups`, and `v2/settings.json`.
On first run, if there are no tabs, the current OS hosts file is imported into an `Imported hosts` tab.

## Updates

GitHub Releases remains the source. Windows/Linux can later use full `electron-updater` installation flow. Because unsigned macOS auto-update is unsupported, macOS opens the latest release page until the app is Developer ID signed.
