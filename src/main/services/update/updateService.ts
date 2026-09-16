import { app, shell } from "electron";
import electronUpdater from "electron-updater";

import type { UpdateState } from "../../../shared/types";

const { autoUpdater } = electronUpdater;

const releaseUrl = "https://github.com/michalskirobert/hosts-editor/releases/latest";

export class UpdateService {
  async check(): Promise<UpdateState> {
    if (!app.isPackaged) {
      return {
        status: "current",
        version: app.getVersion(),
        message: "Update checks are disabled in development.",
      };
    }

    if (process.platform === "darwin") {
      return {
        status: "available",
        message: "Unsigned macOS builds use GitHub Releases.",
        releaseUrl,
      };
    }

    try {
      const result = await autoUpdater.checkForUpdates();
      const version = result?.updateInfo.version;

      return version && version !== app.getVersion()
        ? {
            status: "available",
            version,
            releaseUrl,
          }
        : {
            status: "current",
            version: app.getVersion(),
          };
    } catch (error: unknown) {
      return {
        status: "error",
        message: String(error),
        releaseUrl,
      };
    }
  }

  async open(): Promise<void> {
    await shell.openExternal(releaseUrl);
  }
}
