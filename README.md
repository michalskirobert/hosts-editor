# Hosts Editor

**Hosts Editor by NurByte** is a free, open-source, cross-platform hosts file editor for **macOS, Windows, and Linux**.

Manage your system `hosts` file through a modern desktop GUI instead of editing `/etc/hosts` or the Windows hosts file manually. Hosts Editor provides structured and raw text editing, project-based tabs, search, portable backups, and safe system hosts management.

Built for developers, testers, system administrators, and anyone who regularly works with local domains, development environments, DNS overrides, or custom hostname mappings.

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

**GitHub Releases** is the distribution and update source for Hosts Editor.

The application can check whether a newer version is available.

Update installation behavior depends on the operating system and application signing configuration. For example, unsigned macOS builds can direct the user to the latest GitHub Release rather than silently installing an update.

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

See the repository's `LICENSE` file for the complete license terms.

---

Developed by **NurByte**.
