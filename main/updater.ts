import { autoUpdater, ProgressInfo } from "electron-updater";
import { BrowserWindow, ipcMain, app } from "electron";

export function setupUpdater(mainWindow: BrowserWindow) {
  if (!app.isPackaged) {
    console.log("Dev mode: update checks disabled");
    return;
  }

  autoUpdater.checkForUpdatesAndNotify().catch((err: any) => {
    if (err.code !== "ENOENT") {
      console.error("Update check failed:", err);
    } else {
      console.log(
        "Update config file not found, skipping update check (ENOENT)"
      );
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

  autoUpdater.on("download-progress", (progressObj: ProgressInfo) => {
    if (mainWindow && mainWindow.webContents) {
      const percent = progressObj.percent || 0;
      mainWindow.webContents.send("update-progress", percent);
    }
  });

  ipcMain.on("install-update", () => {
    autoUpdater.quitAndInstall();
  });

  ipcMain.on("check-for-updates", () => {
    autoUpdater.checkForUpdatesAndNotify().catch((err: any) => {
      if (err.code !== "ENOENT") {
        console.error("Update check failed:", err);
      } else {
        console.log(
          "Update config file not found, skipping update check (ENOENT)"
        );
      }
    });
  });
}
