import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import fs from "fs";
import sudo from "sudo-prompt";
import dotenv from "dotenv";

dotenv.config();

const hostsPath =
  process.platform === "win32"
    ? "C:\\Windows\\System32\\drivers\\etc\\hosts"
    : "/etc/hosts";

let mainWindow: BrowserWindow | null = null;

let sessionPassword: string | null = null;

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

  if (process.env.ELECTRON_START_URL) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  if (process.env.IS_LOCALHOST === "true") {
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.removeMenu();

    mainWindow.webContents.on("before-input-event", (event, input) => {
      if (
        (input.control || input.meta) &&
        input.shift &&
        input.key.toLowerCase() === "i"
      ) {
        event.preventDefault();
      }
      if (input.key === "F12") event.preventDefault();
    });

    mainWindow.webContents.on("context-menu", (e) => e.preventDefault());
  }
};

app.on("ready", createWindow);

ipcMain.handle("read-hosts", async () => {
  try {
    const content = fs.readFileSync(hostsPath, "utf-8");
    return content.split("\n");
  } catch (err) {
    return [`# ERROR: ${err}`];
  }
});

ipcMain.handle("read-hosts-raw", async () => {
  try {
    return fs.readFileSync(hostsPath, "utf-8");
  } catch (err) {
    return `# ERROR: ${err}`;
  }
});

ipcMain.handle("set-password", (_event, pw: string) => {
  sessionPassword = pw;
  return true;
});

ipcMain.handle("write-hosts", async (_event, lines: string[]) => {
  return new Promise((resolve, reject) => {
    const content = lines.join("\n");

    let cmd = "";
    let options: { name: string; password?: string } = { name: "Hosts Editor" };

    if (process.platform === "darwin") {
      cmd = `echo "${content}" | sudo -S tee /etc/hosts`;
      if (sessionPassword) options.password = sessionPassword;
    } else {
      cmd = `echo "${content}" > C:\\Windows\\System32\\drivers\\etc\\hosts`;
    }

    sudo.exec(cmd, options, (err) => {
      if (err) return reject(err);
      resolve(true);
    });
  });
});
