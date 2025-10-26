import { BrowserWindow, app } from "electron";
import path from "path";

export function createMainWindow(): BrowserWindow {
  let splash: BrowserWindow | null = null;

  splash = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
  });

  const splashPath = process.env.ELECTRON_START_URL
    ? path.join(__dirname, "../public/splash.html")
    : path.join(app.getAppPath(), "dist/web/splash.html");

  splash.loadFile(splashPath);

  const mainWindow = new BrowserWindow({
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
      splash.close();
      splash = null;
    }
    mainWindow.show();
  });

  const isDev = !!process.env.ELECTRON_START_URL;
  if (isDev) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL!);
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), "dist/web/index.html"));
  }

  if (isDev) mainWindow.webContents.openDevTools();

  return mainWindow;
}
