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
yarn install

Build the app for production:
yarn build

🔑 Permissions

Editing the hosts file requires administrator rights:
• macOS/Linux – uses sudo under the hood
• Windows – requires elevated permissions to write to
C:\Windows\System32\drivers\etc\hosts

⸻

🧩 Project Structure
hosts-editor/
├── src/
│ ├── main/ # Electron main process
│ ├── preload/ # Secure contextBridge API
│ ├── renderer/ # React frontend
│ └── utils/ # Helpers (validation, defaults, etc.)
├── public/
├── package.json
└── README.md

📡 IPC API

Exposed in preload.ts:
window.electronAPI.readHosts(); // array of lines
window.electronAPI.readHostsRaw(); // full file as string
window.electronAPI.writeHosts(lines: string[]); // save as lines

Contributing 1. Fork the repo 2. Create a feature branch (git checkout -b feature/amazing-feature) 3. Commit changes (git commit -m 'Add amazing feature') 4. Push to the branch (git push origin feature/amazing-feature) 5. Open a Pull Request

⸻

📄 License

## MIT License © 2025 Robert Michalski (NurByte Software Lab)

⚡ Question for you: do you want me to also include **build instructions for creating `.dmg` (macOS) and `.exe` (Windows) installers** using `electron-builder` in the README, or keep it lightweight for now?
