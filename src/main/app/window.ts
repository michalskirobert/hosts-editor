import { BrowserWindow, nativeTheme } from "electron";
import { is } from "@electron-toolkit/utils";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { AppSettings } from "../../shared/types";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

const SPLASH_DURATION_MS = 700;

export const createWindow = async (settings: AppSettings): Promise<BrowserWindow> => {
  nativeTheme.themeSource = settings.theme;

  const window = new BrowserWindow({
    width: 1320,
    height: 840,
    minWidth: 1000,
    minHeight: 650,
    show: false,
    fullscreen: settings.fullscreen,
    fullscreenable: true,
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#090d14" : "#f5f7fb",
    webPreferences: {
      preload: path.join(currentDirectory, "../preload/index.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  window.webContents.on("before-input-event", (event, input) => {
    if (input.type === "keyDown" && input.key === "F12") {
      event.preventDefault();
      window.webContents.toggleDevTools();
    }
  });

  window.once("ready-to-show", () => {
    setTimeout(() => {
      if (!window.isDestroyed()) {
        window.show();
      }
    }, SPLASH_DURATION_MS);
  });

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    await window.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    await window.loadFile(path.join(currentDirectory, "../renderer/index.html"));
  }

  return window;
};
