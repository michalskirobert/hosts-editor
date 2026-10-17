# Hosts Editor

**Hosts Editor by NurByte** is a free, open-source, cross-platform hosts file editor for **macOS, Windows, and Linux**.

Manage your system `hosts` file through a modern desktop GUI instead of editing `/etc/hosts` or the Windows hosts file manually. Hosts Editor provides structured and raw text editing, project-based tabs, search, portable backups, and safe system hosts management.

Built for developers, testers, system administrators, and anyone who regularly works with local domains, development environments, DNS overrides, or custom hostname mappings.

Version **2.3.0** is a release candidate. See [CHANGELOG.md](CHANGELOG.md), [TEST-RESULTS.md](TEST-RESULTS.md) and [RELEASING.md](RELEASING.md) for implemented changes, verification and platform limitations.

## Features

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

Hosts Editor uses `electron-updater` and GitHub Releases. The main process checks once after startup when enabled in Settings. Manual checks share the same request and cannot interrupt a running download.

On supported installations, Settings provides **Check for updates → Download update → download progress → Restart & Install**. Progress comes from updater events. Downloads and installation are explicit actions. Closing the app does not automatically install a downloaded update.

Before installation, changes in all tabs must be saved or discarded. **Save & Install** uses the existing system-hosts save; failed validation, denied elevation or a failed write prevents restart. **Discard & Install** restores the last saved snapshots. **Cancel** keeps the editor open.

| Installation                                               | Update behavior in 2.3.0                                                                                                                          |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| macOS Intel / Apple Silicon                                | Manual DMG download for the running architecture. The current configuration disables signing; automatic installation is deliberately unavailable. |
| Windows x64 / arm64, installed NSIS with signing publisher | In-app download and installation through electron-updater, with its normal signature verification. Native validation is still required.           |
| Windows unsigned NSIS / ZIP / portable                     | Manual installer or ZIP download.                                                                                                                 |
| Linux writable AppImage, x64 / arm64                       | In-app update through electron-updater with package checksum validation. End-to-end update from a published release still needs validation.       |
| Linux DEB / read-only AppImage                             | Manual matching package download; install with the OS package manager or replace the AppImage.                                                    |
| Development build                                          | Manual release downloads.                                                                                                                         |

Fallback chooses an asset for the actual process architecture and platform; when no matching asset exists, it opens the verified GitHub release page. GitHub endpoints use HTTPS. No downloaded scripts are executed.

A native update requires the package and its generated `latest*.yml` metadata to be published together. Package hashes are validated by electron-updater. This release uses electron-builder 26 / electron-updater 6 and does not claim the signed update-manifest features of newer major versions.

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
