import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import fs from "fs";
import sudo from "sudo-prompt";
import dotenv from "dotenv";

// Wczytaj zmienne z pliku .env
dotenv.config();

const hostsPath =
  process.platform === "win32"
    ? "C:\\Windows\\System32\\drivers\\etc\\hosts"
    : "/etc/hosts";

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Ładowanie aplikacji (dev / build)
  if (process.env.ELECTRON_START_URL) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // 🔹 DEV: DevTools dostępne
  if (process.env.IS_LOCALHOST === "true") {
    mainWindow.webContents.openDevTools();
  }
  // 🔹 PROD: blokada DevTools + menu
  else {
    mainWindow.removeMenu();

    // Blokada skrótów DevTools
    mainWindow.webContents.on("before-input-event", (event, input) => {
      if (
        (input.control || input.meta) &&
        input.shift &&
        input.key.toLowerCase() === "i"
      ) {
        event.preventDefault();
      }
      if (input.key === "F12") {
        event.preventDefault();
      }
    });

    // Blokada prawego przycisku myszy
    mainWindow.webContents.on("context-menu", (e) => {
      e.preventDefault();
    });
  }
};

app.on("ready", createWindow);

// IPC do czytania/zapisywania hosts
ipcMain.handle("read-hosts", async () => {
  try {
    const content = fs.readFileSync(hostsPath, "utf-8");
    return content.split("\n");
  } catch (err) {
    return [`# ERROR: ${err}`];
  }
});

ipcMain.handle("write-hosts", async (_event, lines: string[]) => {
  return new Promise((resolve, reject) => {
    const content = lines.join("\n");
    const cmd =
      process.platform === "darwin"
        ? `echo "${content}" | sudo tee /etc/hosts`
        : `echo "${content}" > C:\\Windows\\System32\\drivers\\etc\\hosts`;

    sudo.exec(cmd, { name: "Hosts Editor" }, (error) => {
      if (error) return reject(false);
      resolve(true);
    });
  });
});

ipcMain.handle("read-hosts-raw", async () => {
  try {
    return fs.readFileSync(hostsPath, "utf-8");
  } catch (err) {
    return `# ERROR: ${err}`;
  }
});
