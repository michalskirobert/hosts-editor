import { app } from "electron";
import { createMainWindow } from "./windows";
import { registerMenu } from "./menu";
import { registerIpcHandlers } from "./ipcHandlers";
import { setupUpdater } from "./updater";

let mainWindow = null;

app.whenReady().then(() => {
  mainWindow = createMainWindow();
  registerMenu(mainWindow);
  registerIpcHandlers();
  setupUpdater(mainWindow);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
