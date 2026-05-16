import { BrowserWindow, app, globalShortcut } from "electron";
import path from "path";
import os from "os";
import fs from "fs";
import { Settings } from "./settings.types";

export let mainWindow: BrowserWindow | null = null;

export function createMainWindow(): BrowserWindow {
  let splash: BrowserWindow | null = null;

  splash = new BrowserWindow({
    width: 600,
    height: 600,
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

  let settings: Settings = {
    appearance: { fullscreen: false, mode: "auto" },
  };

  const settingsPath = path.join(app.getPath("userData"), "settings.json");

  if (fs.existsSync(settingsPath)) {
    const res = fs.readFileSync(settingsPath, "utf-8");

    settings = JSON.parse(res);
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    fullscreen: settings.appearance.fullscreen,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const destroySplash = () =>
    setTimeout(() => {
      if (splash) {
        splash?.destroy();
        splash = null;
        mainWindow?.show();
      } else {
        mainWindow?.show();
      }
    }, 1500);

  mainWindow.once("ready-to-show", destroySplash);

  if (!app.isPackaged && process.env.ELECTRON_START_URL) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL);
  } else {
    const indexPath = path.join(app.getAppPath(), "dist/web/index.html");
    mainWindow.loadURL(`file://${indexPath}`);
  }

  app.whenReady().then(() => {
    globalShortcut.register("CmdOrCtrl+D+shift", () => {
      mainWindow?.webContents.openDevTools({
        mode: "detach",
        activate: true,
        title: "DEBUGGER",
      });
    });
  });

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

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
