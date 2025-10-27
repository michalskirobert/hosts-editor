import { autoUpdater } from "electron-updater";
import { BrowserWindow, ipcMain } from "electron";

export function setupUpdater(mainWindow: BrowserWindow) {
  autoUpdater.checkForUpdatesAndNotify();
  autoUpdater.on("update-available", () => {
    mainWindow.webContents.send("update-available");
  });
  autoUpdater.on("update-downloaded", () => {
    mainWindow.webContents.send("update-downloaded");
  });
  ipcMain.on("install-update", () => {
    autoUpdater.quitAndInstall();
  });
  ipcMain.on("check-for-updates", () => {
    autoUpdater.checkForUpdatesAndNotify();
  });
}
