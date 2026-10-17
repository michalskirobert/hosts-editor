import { app, dialog } from "electron";
import type { BrowserWindow } from "electron";

import { createSplashWindow, createWindow } from "./app/window";
import { registerIpc } from "./ipc/register";
import { HostsService } from "./services/hosts/hostsService";
import { StorageService } from "./services/storage/storageService";
import { UpdateService } from "./services/update/updateService";

const storage = new StorageService();
const hosts = new HostsService();
const updates = new UpdateService();

let mainWindow: BrowserWindow | undefined;
let splashWindow: BrowserWindow | undefined;
let opening = false;
let quitting = false;

const isQuitting = (): boolean => quitting;

const closeSplash = (): void => {
  const window = splashWindow;
  splashWindow = undefined;

  if (window && !window.isDestroyed()) {
    window.destroy();
  }
};

const showStartupError = (error: unknown): void => {
  if (isQuitting()) return;

  console.error("Failed to start Hosts Editor:", error);

  dialog.showErrorBox(
    "Hosts Editor could not start",
    error instanceof Error
      ? error.message
      : "An unexpected error occurred while loading the application.",
  );

  app.quit();
};

const initializeStorage = async (): Promise<void> => {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    await Promise.race([
      storage.init(),
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(() => {
          reject(new Error("The application data could not be loaded in time."));
        }, 30_000);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
};

const openMainWindow = async (): Promise<void> => {
  if (opening || isQuitting()) return;

  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
    return;
  }

  opening = true;

  try {
    splashWindow ??= await createSplashWindow();

    if (isQuitting()) return;

    const settings = await storage.getSettings();

    if (isQuitting()) return;

    const window = await createWindow(settings);

    if (isQuitting()) {
      window.destroy();
      return;
    }

    mainWindow = window;

    window.once("closed", () => {
      if (mainWindow === window) mainWindow = undefined;
    });

    closeSplash();
  } finally {
    opening = false;
  }
};

const bootstrap = async (): Promise<void> => {
  splashWindow = await createSplashWindow();

  if (isQuitting()) return;

  await initializeStorage();

  if (isQuitting()) return;

  registerIpc(storage, hosts, updates);

  await openMainWindow();

  if (isQuitting()) return;

  void updates
    .init()
    .then(async () => {
      const settings = await storage.getSettings();

      if (settings.checkForUpdates && !isQuitting()) {
        await updates.check();
      }
    })
    .catch((error: unknown) => {
      console.warn("Update initialization failed:", error);
    });

  app.on("activate", () => {
    void openMainWindow().catch(showStartupError);
  });
};

const primaryInstance = app.requestSingleInstanceLock();

if (!primaryInstance) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (isQuitting()) return;

    const window = mainWindow && !mainWindow.isDestroyed() ? mainWindow : splashWindow;

    if (!window || window.isDestroyed()) return;

    if (window.isMinimized()) window.restore();
    window.show();
    window.focus();
  });

  void app.whenReady().then(bootstrap).catch(showStartupError);
}

app.on("before-quit", () => {
  quitting = true;
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
