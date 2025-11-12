import { ipcMain } from "electron";
import { mainWindow } from "../windows";

export const checkForUpdates = {
  label: "Check for updates",
  click: () => {
    ipcMain.emit("check-for-updates");
  },
};
export const about = { role: "about" as const };
export const separator = { type: "separator" as const };
export const quit = { role: "quit" as const };
export const settings = {
  label: "Settings",
  accelerator: "CmdOrCtrl+,",
  click: () => {
    mainWindow?.webContents.send("open-settings");
  },
};
