import { BrowserWindow, app } from "electron";
import path from "path";
import os from "os";

let mainWindow: BrowserWindow | null = null;

export function createMainWindow(): BrowserWindow {
  let splash: BrowserWindow | null = null;

  splash = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
  });

  const splashPath = app.isPackaged
    ? path.join(app.getAppPath(), "dist/web/splash.html")
    : path.join(__dirname, "../public/splash.html");

  splash.loadFile(splashPath);

  if (os.platform() === "linux" && process.env.APPIMAGE) {
    app.commandLine.appendSwitch("no-sandbox");
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.once("ready-to-show", () => {
    if (splash) {
      if (os.platform() === "linux") {
        setTimeout(() => {
          splash?.destroy();
          splash = null;
          mainWindow?.show();
        }, 500);
      } else {
        splash.destroy();
        splash = null;
        mainWindow?.show();
      }
    } else {
      mainWindow?.show();
    }
  });

  if (!app.isPackaged && process.env.ELECTRON_START_URL) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL);
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(app.getAppPath(), "dist/web/index.html");
    mainWindow.loadURL(`file://${indexPath}`);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  return mainWindow;
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createMainWindow();
  }
});
