import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import fs from "fs";
import sudo from "sudo-prompt";

if (process.env.NODE_ENV === "development") {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("dotenv").config();
}

let mainWindow: BrowserWindow | null = null;
let splash: BrowserWindow | null = null;
let sessionPassword: string | null = null;

const hostsPath =
  process.platform === "win32"
    ? "C:\\Windows\\System32\\drivers\\etc\\hosts"
    : "/etc/hosts";

const createWindow = () => {
  splash = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
  });

  const splashPath = process.env.ELECTRON_START_URL
    ? path.join(__dirname, "../public/splash.html")
    : path.join(app.getAppPath(), "public/splash.html");
  splash.loadFile(splashPath);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  mainWindow.once("ready-to-show", () => {
    if (splash) {
      splash.close();
      splash = null;
    }
    mainWindow?.show();
  });

  const isDev = !!process.env.ELECTRON_START_URL;

  if (isDev) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL!);
  } else {
    const indexPath = path.join(app.getAppPath(), "dist/web/index.html");
    mainWindow.loadFile(indexPath);
  }

  if (isDev) {
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

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
