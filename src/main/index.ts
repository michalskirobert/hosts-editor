import { app, BrowserWindow } from "electron";

import { createWindow } from "./app/window";
import { registerIpc } from "./ipc/register";
import { HostsService } from "./services/hosts/hostsService";
import { StorageService } from "./services/storage/storageService";
import { UpdateService } from "./services/update/updateService";

const storage = new StorageService();
const hosts = new HostsService();
const updates = new UpdateService();

const bootstrap = async (): Promise<void> => {
  await storage.init();

  registerIpc(storage, hosts, updates);

  await createWindow(await storage.getSettings());

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow({
        theme: "system",
        fullscreen: false,
        checkForUpdates: true,
      }).catch((error: unknown) => {
        console.error("Failed to recreate the application window:", error);
      });
    }
  });
};

void app
  .whenReady()
  .then(bootstrap)
  .catch((error: unknown) => {
    console.error("Failed to start Hosts Editor:", error);
    app.quit();
  });

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
