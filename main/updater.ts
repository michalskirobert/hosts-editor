import { autoUpdater } from "electron-updater";
import { BrowserWindow, ipcMain, app } from "electron";

export function setupUpdater(mainWindow: BrowserWindow) {
  if (!app.isPackaged) {
    console.log("Dev mode: update checks disabled");
    return;
  }

  console.log("app.isPackaged =", app.isPackaged);

  // Only check for updates in production
  autoUpdater.checkForUpdatesAndNotify().catch(err => {
    if ((err as any).code !== 'ENOENT') {
      console.error("Update check failed:", err);
    } else {
      console.log("Update config file not found, skipping update check (ENOENT)");
    }
  });

  autoUpdater.on("update-available", () => {
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send("update-available");
    }
  });

  autoUpdater.on("update-downloaded", () => {
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send("update-downloaded");
    }
  });

  ipcMain.on("install-update", () => {
    autoUpdater.quitAndInstall();
  });

  ipcMain.on("check-for-updates", () => {
    autoUpdater.checkForUpdatesAndNotify().catch(err => {
      if ((err as any).code !== 'ENOENT') {
        console.error("Update check failed:", err);
      } else {
        console.log("Update config file not found, skipping update check (ENOENT)");
      }
    });
  });
}
