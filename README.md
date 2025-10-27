# 🖥️ Hosts Editor

A simple cross-platform **Electron application** for managing your system `hosts` file with a user-friendly interface.
Supports two modes:

- **Structured mode** – edit entries as checkboxes and text fields
- **Raw mode** – edit the entire `hosts` file as plain text

---

## ✨ Features

- 🔍 View and edit your system `hosts` file
- ✅ Enable/disable entries with checkboxes
- ✏️ Switch between _form mode_ and _raw text mode_
- ➕ Add new host entries quickly
- 🔒 Uses `sudo` (macOS/Linux) or admin rights (Windows) to save changes
- ⚡ Built with [Electron](https://www.electronjs.org/), [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), and [React Hook Form](https://react-hook-form.com/)

---

## 📸 Screenshots

> _(Coming soon – add screenshots of structured view and raw edit mode)_

---

## 🚀 Installation

Clone the repository:

```bash
git clone https://github.com/michalskirobert/hosts-editor.git
cd hosts-editor
```

Install dependencies:

```bash
yarn install
```

Build the app for production:

```bash
yarn build
```

## 🔑 Permissions

Editing the hosts file requires administrator rights:

- **macOS/Linux** – uses `sudo` under the hood
- **Windows** – requires elevated permissions to write to
  `C:\Windows\System32\drivers\etc\hosts`

---

## 🧩 Project Structure

```bash
hosts-editor/
├── README.md
├── assets
│   ├── icon.icns
│   └── icon.ico
├── dist
│   └── web
│       ├── assets
│       │   ├── index-00snpQl_.css
│       │   └── index-Dq89rUXI.js
│       ├── index.html
│       ├── logo.png
│       ├── splash.html
│       └── vite.svg
├── electron-dist
│   ├── ipcHandlers.js
│   ├── ipcHandlers.js.map
│   ├── main.js
│   ├── main.js.map
│   ├── menu.js
│   ├── menu.js.map
│   ├── preload.js
│   ├── preload.js.map
│   ├── updater.js
│   ├── updater.js.map
│   ├── windows.js
│   └── windows.js.map
├── eslint.config.js
├── index.html
├── main
│   ├── ipcHandlers.ts
│   ├── main.ts
│   ├── menu.ts
│   ├── preload.ts
│   ├── updater.ts
│   └── windows.ts
├── package.json
├── postcss.config.js
├── public
│   ├── logo.png
│   ├── splash.html
│   └── vite.svg
├── src
│   ├── App.tsx
│   ├── assets
│   │   └── react.svg
│   ├── components
│   │   ├── layout
│   │   │   └── Header.tsx
│   │   ├── modals
│   │   │   └── AddFieldFormModal
│   │   └── shared
│   │       ├── CustomButton.tsx
│   │       └── form
│   ├── electron.d.ts
│   ├── helpers
│   │   └── process-lines.ts
│   ├── hooks
│   │   └── use-hosts.ts
│   ├── index.css
│   ├── main.tsx
│   ├── types
│   │   ├── hosts.ts
│   │   └── modals.ts
│   ├── utils
│   │   ├── defaultValues.ts
│   │   ├── isHostLine.ts
│   │   ├── loadersManager.ts
│   │   └── modalsManager.ts
│   └── vite-env.d.ts
├── stylelint.config.js
├── tailwind.config.js
├── tsconfig.app.json
├── tsconfig.electron.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── yarn.lock
```

⸻

## 📡 IPC API

```ts
// --- Read operations ---
window.electronAPI.readHosts(); // Returns an array of lines from the hosts file
window.electronAPI.readHostsRaw(); // Returns the full hosts file as a single string

// --- Write operations ---
window.electronAPI.writeHosts(lines); // Saves an array of lines to the hosts file

// --- Authentication ---
window.electronAPI.setPassword(pw); // Stores user password securely for elevated writes

// --- Menu integration ---
window.electronAPI.onTriggerSave(); // Called when "Save" is triggered from the app menu
window.electronAPI.removeTriggerSaveListener(); // Removes the menu save listener
```

📄 License

## MIT License © 2025 Robert Michalski (NurByte Software Lab)

⚡ Question for you: do you want me to also include **build instructions for creating `.dmg` (macOS) and `.exe` (Windows) installers** using `electron-builder` in the README, or keep it lightweight for now?
