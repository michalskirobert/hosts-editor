import { autoUpdater } from "electron-updater";
import { BrowserWindow, ipcMain, app, dialog, shell } from "electron";
import { toast } from "./toast";

export function setupUpdater(mainWindow: BrowserWindow) {
  if (!app.isPackaged) {
    toast({ type: "warning", message: "Dev mode: update checks disabled" });
    return;
  }

  autoUpdater.on(
    "update-available",
    ({ releaseName, releaseNotes, version }) => {
      if (mainWindow && mainWindow.webContents) {
        dialog
          .showMessageBox(mainWindow, {
            type: "info",
            buttons: ["Download", "Skip"],
            defaultId: 0,
            cancelId: 1,
            title: `Update available: ${version}`,
            message: `A new version is available!`,
            detail:
              (releaseNotes || releaseName)
                ?.toString()
                .replace(/<[^>]+>/g, "") || "No release notes.",
            noLink: true,
          })
          .then((returnValue) => {
            if (returnValue.response === 0)
              shell.openExternal(
                "https://github.com/michalskirobert/hosts-editor/releases/latest"
              );
          })
          .catch((error: Error) => {
            toast({ type: "error", message: error.message });
          });
      }
    }
  );

  autoUpdater.on("update-not-available", ({ version }) =>
    dialog.showMessageBox(mainWindow, {
      type: "info",
      buttons: ["Roger that"],
      defaultId: 0,
      cancelId: 1,
      title: `The newest version: ${version}`,
      message: `Your version is currently up to date.`,
    })
  );

  ipcMain.on("check-for-updates", () => {
    autoUpdater.checkForUpdates().catch((error: Error) => {
      toast({ type: "error", message: error.message });
    });
  });
}
