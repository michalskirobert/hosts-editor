# Hosts Editor

**Hosts Editor by NurByte** is a free, open-source, cross-platform hosts file editor for **macOS, Windows, and Linux**.

Manage your system `hosts` file through a modern desktop GUI instead of editing `/etc/hosts` or the Windows hosts file manually. Hosts Editor provides structured and raw text editing, project-based tabs, search, portable backups, and safe system hosts management.

Built for developers, testers, system administrators, and anyone who regularly works with local domains, development environments, DNS overrides, or custom hostname mappings.

### Hosts file editing

- Edit the system hosts file on macOS, Windows, and Linux.
- Use **Objects mode** for structured IP address and hostname editing.
- Use **Text mode** for direct raw hosts file editing.
- Add, edit, enable, disable, and remove hosts entries.
- Import the current system hosts file into the active tab.
- Save the active configuration directly to the system hosts file.
- Detect unsaved changes without marking a document as modified when switching between Objects and Text views.

### Search

- Search and filter entries in Objects mode.
- Find text directly in Text mode.
- Navigate between matching results.
- View the current match and total match count.

### Tabs

Hosts Editor uses JSON-backed tabs to keep different hosts configurations separated.

This makes it possible to maintain independent configurations for different projects, environments, or development setups without manually managing multiple hosts files.

### Backups

Hosts Editor includes a built-in **Backup Explorer**.

- Create manual backups.
- Enable optional daily automatic backups.
- Keep recent automatic backup snapshots.
- Restore a selected backup explicitly.
- Import and export individual backups as JSON.
- Import and export backup collections as ZIP archives.
- Move compatible backups between Hosts Editor installations and operating systems.
- Validate imported backup files and archives before accepting them.

Importing a backup **does not overwrite the system hosts file**. Imported backups are added to Backup Explorer and can be restored explicitly when needed.

### Appearance and UX

- Light theme.
- Dark theme.
- System theme.
- Modern desktop interface.
- Keyboard-friendly controls.
- Disabled-state explanations.
- Unsaved-change protection.
- Built-in notifications and status feedback.

### Feedback

Bug reports and feature requests can be sent directly from Hosts Editor.

Optional diagnostics can be attached to help identify technical problems. Diagnostic reports are designed to exclude sensitive hosts configuration data such as hostnames, IP addresses, hosts file contents, and backups.

## Common use cases

Hosts Editor can be used for:

- local development domains,
- localhost aliases,
- staging and testing environments,
- local DNS overrides,
- mapping domains to custom IP addresses,
- switching between project environments,
- managing large hosts files,
- temporarily enabling or disabling mappings,
- maintaining separate hosts configurations for different projects,
- backing up and restoring hosts configurations,
- transferring hosts configurations between computers.

Typical system hosts file locations are:

```text
macOS / Linux
/etc/hosts

Windows
C:\Windows\System32\drivers\etc\hosts
```

## Platform support

| Platform | Architecture                       |
| -------- | ---------------------------------- |
| macOS    | Apple Silicon (arm64), Intel (x64) |
| Windows  | x64, arm64                         |
| Linux    | x64, arm64                         |

Modifying the system hosts file requires elevated operating-system permissions. The authorization mechanism therefore differs between platforms.

## Tech stack

Hosts Editor is built with:

- **Electron**
- **React**
- **TypeScript**
- **Vite / electron-vite**
- **Tailwind CSS**
- **Zod**
- **electron-builder**
- **Yarn Berry**

The application uses strict TypeScript and keeps operating-system-specific hosts operations outside the renderer.

Electron runs with context isolation enabled and Node.js integration disabled in the renderer.

## Development

### Requirements

- Node.js 24+ recommended
- Corepack
- Yarn Berry

Clone the repository and install dependencies:

```bash
corepack enable
yarn install
```

Start Hosts Editor in development mode:

```bash
yarn dev
```

## Scripts

### Development

```bash
yarn dev
```

Starts the application using `electron-vite` in development mode.

### Build and quality checks

```bash
yarn build
```

Runs TypeScript validation and creates the Electron production build.

```bash
yarn typecheck
```

Runs TypeScript without emitting files.

```bash
yarn lint
```

Runs ESLint with zero warnings allowed.

```bash
yarn format
```

Formats the project with Prettier.

```bash
yarn format:check
```

Checks formatting without modifying files.

```bash
yarn preview
```

Previews the production `electron-vite` build.

## Distribution builds

Build the application locally without publishing:

```bash
yarn dist
```

Build for a specific operating system:

```bash
yarn dist:mac
yarn dist:win
yarn dist:linux
```

When possible, installers should be built and tested on their target operating system.

## Publishing releases

Hosts Editor uses `electron-builder` for release artifacts and **GitHub Releases** for distribution.

Publish using the configured release targets:

```bash
yarn release
```

Platform-specific release commands:

```bash
yarn release:mac
yarn release:win
yarn release:linux
```

The current release scripts build both supported architectures:

```text
macOS    x64 + arm64
Windows  x64 + arm64
Linux    x64 + arm64
```

Publishing requires the appropriate release credentials and environment configuration.

Never commit GitHub tokens, signing credentials, `.env` files, or other secrets to the repository.

## Application data

Hosts Editor stores its application data inside Electron's platform-specific `userData` directory.

Application data includes:

- tabs,
- backup metadata,
- backup files,
- automatic backup state,
- application settings.

Tabs are JSON-backed and act as the source of truth for configurations managed by Hosts Editor.

## Updates

The application checks the official GitHub repository once after startup when enabled. Manual checks display their result in Settings and never open a global modal after navigation. A startup notice can appear once per version per application session; acknowledgement lives in the main process and survives closing/reopening the application window.

All checks and downloads share the main-process update state. Download progress persists across navigation; cancellation aborts the stream and removes the partial file. Updates use stable SemVer comparisons, exact OS/architecture tokens and HTTPS official repository assets. The 2.3.2 naming matcher is preserved, including arbitrary product prefixes, mac/darwin variants and DMG preference. Blockmaps and source archives are not installers.

### Installation

| Installation                  | Behavior in 2.3.3                                                                                                                                                                                           |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| macOS Intel / Apple Silicon   | Download and verify the matching DMG. Install Update → Ready to Install → Quit & Open Installer. Resolve unsaved changes, open the package, then quit gracefully. Replace the app in Applications manually. |
| macOS ZIP fallback            | Uses the same guarded handoff when a matching DMG is unavailable. DMG remains preferred.                                                                                                                    |
| Windows signed installed NSIS | Existing explicit Restart & Install through electron-updater with its configured verification.                                                                                                              |
| Windows unsigned / portable   | Download, verify, open or reveal the matching EXE/ZIP. No new automatic installation support.                                                                                                               |
| Linux writable AppImage       | Existing explicit native updater workflow.                                                                                                                                                                  |
| Linux other installations     | Download, verify and open/reveal the matching supported package.                                                                                                                                            |

Cancel keeps the application running. Existing Save/Discard/Cancel protection is reused; Save & Install uses the existing explicit system-hosts save. A failed save or denied authorization prevents installation. Failed installer verification or opening also prevents shutdown. Opening the DMG is not proof of installation.

No Developer ID certificate, Apple subscription, signing/notarization infrastructure, privileged helper, Gatekeeper bypass or programmatic application replacement is introduced. Existing quarantine handling is retained. Native Windows/Linux capability detection is preserved. Closing the application never automatically installs an update.

### Download integrity and storage

Direct downloads require the SHA-256 digest from official GitHub release metadata. Expected size, actual bytes, package magic and hash are checked before ready status and before open/reveal. This establishes integrity against metadata obtained over HTTPS; it is not a publisher signature. Only approved GitHub HTTPS URLs/redirects are used. Partial files are created exclusively; a completed package is finalized without replacing an unrelated existing file.

Files stay under `userData/updates/installers`, with a versioned index in `userData/updates/installer-index.json`. The index tracks public asset metadata and version; it contains no hosts content. On startup, tracked partials are removed and tracked completed installers are removed only when the running version is equal to or newer than their version. Restarting the old app retains a future installer. Opening an installer does not trigger deletion. Cleanup runs after the main window is shown, catches cleanup failures and retries on a later startup. It never operates on Downloads, the installed app or external symlink targets, and never force-unmounts a DMG.

Legacy untracked files are preserved. An exact existing cache entry can be adopted only after a fresh official check and verification; unknown older files are not deleted by filename patterns. Native electron-updater caches remain under that library's existing management.

The notification center upserts available/downloaded state for the same release and merges duplicate update errors. Typed IPC and monotonic revisions protect against stale snapshots. Updates stop publishing after shutdown begins; destroyed-renderer delivery failures are logged without logging host configurations or paths.

**Upgrade from 2.3.2:** the old app still runs its old installer workflow. Close 2.3.2 manually when replacing it with 2.3.3. The corrected handoff applies once 2.3.3 is running.

See [ROOT-CAUSES-2.3.3.md](ROOT-CAUSES-2.3.3.md), [TEST-RESULTS.md](TEST-RESULTS.md) and [RELEASING.md](RELEASING.md). Target-OS manual acceptance remains required before public release.

## 2.3.0 editor and safety details

- One persistent Search field. Objects mode filters rows; Text mode highlights literal, case-insensitive matches.
- Enter / Shift+Enter and Previous / Next wrap through results without moving keyboard focus to the editor.
- Shared overlay metrics include font, wrapping, padding, tabs and scrollbar width. Active wrapped matches scroll into view.
- Search controls and the Objects / Text capsule keep stable positions. The sticky wrapper stays transparent.
- Explicit Light / Dark themes now use a class-based Tailwind variant; System theme follows changes while the app is open.
- Raw editing preserves spaces, tabs, comments and incomplete input. Unrecognized entries remain visible and block system-hosts writes until corrected; they are not silently commented out.
- System-hosts writes are staged into a nonempty temporary file in the same directory, then replaced with elevated privileges. The preceding file is retained at `hosts.hosts-editor.backup`. A failed write or cancelled elevation is reported.
- Concurrent JSON writes use unique temporary files and serialize per destination.
- Backup import validates archive counts and expanded sizes before accepting entries. Imported backups do not change tabs or system hosts. Manual backups are excluded from automatic retention.
- Toasts last 3 seconds for success/info, 4.5 seconds for warnings and 6 seconds for errors. Dismissal pauses while hovered or focused and resumes with remaining time.
- Dialogs use native focus containment and restore focus on close. Feedback retains one Settings entry, CAPTCHA loading/retry and optional diagnostics, which default to off.

## Tests

```bash
yarn install --immutable
yarn typecheck
yarn lint
yarn format:check
yarn test
yarn build
```

`yarn test` uses Node's built-in test runner and esbuild to load services with isolated Electron, updater, network and privileged-command adapters. It operates in temporary directories, checks that the real system hosts file remains unchanged, and never executes a privileged write. See `TEST-RESULTS.md` for the separate renderer checks and the remaining native verification.

### Optional renderer smoke test

`tests/renderer.smoke.mjs` runs the built React application in Playwright Chromium with a mocked preload API. It does not modify system hosts or submit real feedback. Run it after `yarn build` with Playwright available to Node:

```bash
node tests/renderer.smoke.mjs
```

When using a separate test-tool installation, set `PLAYWRIGHT_PACKAGE_JSON` to that installation's package.json. `CHROMIUM_EXECUTABLE_PATH` can select an existing Chromium binary; `CHROMIUM_ARGS_JSON` accepts its launch-argument array. `QA_ARTIFACT_DIR` chooses where the test writes screenshots and its result JSON; the default is a temporary directory. These are test-runner options and do not affect the desktop app. Playwright is optional and is not added as a production dependency.

## Security and privacy

Hosts Editor operates on a security-sensitive operating-system file, so system hosts modifications are handled outside the React renderer through the Electron application layer.

Additional safeguards include:

- context isolation,
- no Node.js integration in the renderer,
- validation of imported backup data,
- validation and limits for ZIP backup archives,
- protection against unsafe archive paths,
- explicit restore operations,
- rejection of invalid hosts data,
- optional rather than automatic diagnostic submission.

Hosts configurations and backups remain local unless the user explicitly exports them.

## Project history

Hosts Editor 2.x is a ground-up rewrite of the original Hosts Editor 1.x application.

The 2.x generation introduced:

- Electron + React architecture,
- strict TypeScript,
- cross-platform system adapters,
- JSON-backed tabs,
- structured and raw editing,
- backup management,
- portable backup archives,
- redesigned search,
- modern light and dark themes,
- integrated update checks,
- in-app feedback.

## Contributing

Bug reports and feature suggestions are welcome.

You can use GitHub Issues or the built-in **Send feedback** feature in Hosts Editor.

When reporting a bug, include the operating system, Hosts Editor version, and steps needed to reproduce the problem whenever possible.

Please do not publish sensitive hosts file contents, private domains, internal IP addresses, credentials, or other confidential configuration data in public issues.

## License

Hosts Editor is a free and open-source project by **NurByte**.

The package metadata declares the MIT license.

---

Developed by **NurByte**.
