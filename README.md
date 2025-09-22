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
├── src/
│ ├── main/ # Electron main process
│ ├── preload/ # Secure contextBridge API
│ ├── renderer/ # React frontend
│ │ └── components/ # UI components (buttons, inputs, checkboxes, etc.)
│ └── utils/ # Helpers (validation, defaults, etc.)
├── public/ # Static assets
├── package.json
└── README.md
```

⸻

## 📡 IPC API

The following API is exposed in `preload.ts`:

```ts
window.electronAPI.readHosts();       // returns array of lines
window.electronAPI.readHostsRaw();    // returns full file as string
window.electronAPI.writeHosts(lines); // saves lines to hosts file

📄 License

## MIT License © 2025 Robert Michalski (NurByte Software Lab)

⚡ Question for you: do you want me to also include **build instructions for creating `.dmg` (macOS) and `.exe` (Windows) installers** using `electron-builder` in the README, or keep it lightweight for now?
```
