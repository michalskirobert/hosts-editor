import { app, dialog } from "electron";
import type { BrowserWindow } from "electron";

import type * as WindowModule from "./app/window";
import type { StorageService } from "./services/storage/storageService";
import type { UpdateService } from "./services/update/updateService";

const development = !app.isPackaged;

let storage: StorageService | undefined;
let updates: UpdateService | undefined;
let windows: typeof WindowModule | undefined;
let mainWindow: BrowserWindow | undefined;
let splashWindow: BrowserWindow | undefined;
let opening = false;
let quitting = false;
let shutdownStarted = false;
let shutdownComplete = false;

const trace = (stage: string): void => {
  if (development) console.info("[startup] " + stage);
};

trace("main entry loaded");

process.on("uncaughtExceptionMonitor", (error, origin) => {
  console.error("[startup] uncaught exception", origin, error);
});

const isQuitting = (): boolean => quitting;

const closeSplash = (): void => {
  const window = splashWindow;
  splashWindow = undefined;

  if (window && !window.isDestroyed()) window.destroy();
};

const showStartupError = (error: unknown): void => {
  console.error("[startup] failed", error);

  if (isQuitting()) return;

  closeSplash();

  dialog.showErrorBox(
    "Hosts Editor could not start",
    error instanceof Error ? error.message : "An unexpected startup error occurred.",
  );

  app.quit();
};

const initializeStorage = async (service: StorageService): Promise<void> => {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    await Promise.race([
      service.init(),
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

  const service = storage;
  const factory = windows;

  if (!service || !factory) {
    throw new Error("Application services are not initialized.");
  }

  opening = true;

  try {
    splashWindow ??= await factory.createSplashWindow();

    if (isQuitting()) return;

    trace("loading settings");

    const settings = await service.getSettings();

    if (isQuitting()) return;

    trace("creating main window");

    const window = await factory.createWindow(settings);

    if (isQuitting()) {
      window.destroy();
      return;
    }

    mainWindow = window;

    window.webContents.on("render-process-gone", (_event, details) => {
      console.error("Hosts Editor renderer stopped.", {
        reason: details.reason,
        exitCode: details.exitCode,
      });
    });

    window.once("closed", () => {
      trace("main window closed");
      if (mainWindow === window) mainWindow = undefined;
    });

    closeSplash();
    trace("main window ready");
  } finally {
    opening = false;
  }
};

const bootstrap = async (): Promise<void> => {
  if (isQuitting()) return;

  trace("Electron ready; loading window module");

  windows = await import("./app/window");

  if (isQuitting()) return;

  trace("creating splash");

  splashWindow = await windows.createSplashWindow();

  if (isQuitting()) return;

  trace("loading services");

  const [storageModule, hostsModule, updateModule, ipcModule] = await Promise.all([
    import("./services/storage/storageService"),
    import("./services/hosts/hostsService"),
    import("./services/update/updateService"),
    import("./ipc/register"),
  ]);

  if (isQuitting()) return;

  storage = new storageModule.StorageService();

  const hosts = new hostsModule.HostsService();
  const updater = new updateModule.UpdateService();

  updates = updater;

  trace("initializing storage");

  await initializeStorage(storage);

  if (isQuitting()) return;

  trace("registering IPC");

  ipcModule.registerIpc(storage, hosts, updater);

  await openMainWindow();

  if (isQuitting()) return;

  const settingsService = storage;

  void updater
    .init()
    .then(async () => {
      const settings = await settingsService.getSettings();

      if (settings.checkForUpdates && !isQuitting()) {
        await updater.check("startup");
      }
    })
    .catch((error: unknown) => {
      console.warn("Update initialization failed:", error);
    });

  app.on("activate", () => {
    void openMainWindow().catch(showStartupError);
  });
};

app.on("before-quit", (event) => {
  trace("before-quit");

  if (development && !shutdownComplete && !shutdownStarted) {
    console.trace("[startup] quit requested");
  }

  if (shutdownComplete) return;

  event.preventDefault();

  if (shutdownStarted) return;

  shutdownStarted = true;
  quitting = true;

  void (updates?.shutdown() ?? Promise.resolve())
    .catch(() => {
      console.warn("Update shutdown did not complete cleanly.");
    })
    .finally(() => {
      shutdownComplete = true;
      app.quit();
    });
});

app.on("will-quit", () => {
  trace("will-quit");
});

app.on("quit", (_event, exitCode) => {
  if (development) console.info("[startup] quit completed", { exitCode });
});

app.on("window-all-closed", () => {
  trace("window-all-closed");

  if (process.platform !== "darwin") app.quit();
});

const start = (): void => {
  const primaryInstance = app.requestSingleInstanceLock();
  trace("single-instance lock: " + String(primaryInstance));

  if (!primaryInstance) {
    console.warn("Hosts Editor is already running for this application profile.");
    app.quit();
    return;
  }

  app.on("second-instance", () => {
    if (isQuitting()) return;

    const window = mainWindow && !mainWindow.isDestroyed() ? mainWindow : splashWindow;

    if (!window || window.isDestroyed()) return;

    if (window.isMinimized()) window.restore();
    window.show();
    window.focus();
  });

  trace("waiting for Electron ready");
  void app.whenReady().then(bootstrap).catch(showStartupError);
};
try {
  start();
} catch (error: unknown) {
  showStartupError(error);
}
