import { autoUpdater } from "electron-updater";
import { BrowserWindow, ipcMain } from "electron";

export function setupUpdater(mainWindow: BrowserWindow) {
  // Sprawdź aktualizacje i powiadom użytkownika
  autoUpdater.checkForUpdatesAndNotify();

  // Powiadom renderer o dostępnej aktualizacji
  autoUpdater.on("update-available", () => {
    mainWindow.webContents.send("update-available");
  });

  // Powiadom renderer, że update został pobrany
  autoUpdater.on("update-downloaded", () => {
    mainWindow.webContents.send("update-downloaded");
  });

  // IPC do instalacji aktualizacji
  ipcMain.on("install-update", () => {
    autoUpdater.quitAndInstall();
  });

  // IPC do ręcznego sprawdzenia aktualizacji
  ipcMain.on("check-for-updates", () => {
    autoUpdater.checkForUpdatesAndNotify();
  });
}
