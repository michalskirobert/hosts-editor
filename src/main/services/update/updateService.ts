import { app, BrowserWindow, shell } from "electron";
import updater from "electron-updater";
import fs from "node:fs/promises";
import path from "node:path";

import { IPC } from "../../../shared/contracts/ipc";
import type { UpdateState } from "../../../shared/types";
import {
  isNewerVersion,
  releaseApiUrl,
  releaseSchema,
  releaseUrl,
  safeReleaseUrl,
  selectReleaseAsset,
} from "./release";

const { autoUpdater } = updater;

export class UpdateService {
  private state: UpdateState = { status: "idle", currentVersion: app.getVersion() };
  private pending: Promise<UpdateState> | undefined;
  private safety = { dirty: true, busy: true };
  private lastCheck = 0;
  private initialized = false;

  getState(): UpdateState {
    return this.state;
  }

  setSafety(dirty: boolean, busy: boolean): void {
    this.safety = { dirty, busy };
  }

  private publish(value: UpdateState): UpdateState {
    this.state = { currentVersion: app.getVersion(), ...value };
    for (const window of BrowserWindow.getAllWindows()) {
      if (!window.isDestroyed()) window.webContents.send(IPC.updateStateChanged, this.state);
    }
    return this.state;
  }

  private configure(): void {
    if (this.initialized) return;
    this.initialized = true;
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = false;
    autoUpdater.allowPrerelease = false;
    autoUpdater.allowDowngrade = false;
    autoUpdater.on("update-available", (info) => {
      this.publish({
        ...this.state,
        status: "available",
        version: info.version,
        message: `Version ${info.version} is available.`,
      });
    });
    autoUpdater.on("update-not-available", () => {
      this.publish({ ...this.state, status: "current", message: "Hosts Editor is up to date." });
    });
    autoUpdater.on("download-progress", (progress) => {
      this.publish({
        ...this.state,
        status: "downloading",
        message: "Downloading update…",
        progress: {
          percent: Math.min(100, Math.max(0, progress.percent)),
          transferred: progress.transferred,
          total: progress.total,
        },
      });
    });
    autoUpdater.on("update-downloaded", (info) => {
      this.publish({
        ...this.state,
        status: "downloaded",
        version: info.version,
        message: "Update verified and ready. Restart when you are ready to install.",
      });
    });
    autoUpdater.on("error", (error) => {
      this.fail(error);
    });
  }

  private fail(error: unknown): UpdateState {
    console.error(
      "Update operation failed:",
      error instanceof Error ? error.message : "Unknown update error",
    );
    return this.publish({
      ...this.state,
      status: "error",
      message:
        "Update failed. Check your connection and try again, or download the release manually.",
      releaseUrl,
    });
  }

  private async capability(): Promise<string | undefined> {
    if (!app.isPackaged)
      return "Development builds use manual downloads. Install a packaged release to use in-app updates.";
    if (!["x64", "arm64"].includes(process.arch))
      return "Use the release page for this architecture.";
    if (process.platform === "darwin")
      return "This release is distributed without verified Developer ID signing and notarization. Download the matching DMG and replace the app manually.";
    if (process.platform === "linux") {
      if (!process.env.APPIMAGE)
        return "In-app installation is supported for AppImage only. Update DEB installations using the downloaded package or your package manager.";
      try {
        await fs.access(process.env.APPIMAGE, fs.constants.W_OK);
      } catch {
        return "The AppImage is not writable. Download the new AppImage and replace it manually.";
      }
      return undefined;
    }
    if (process.platform === "win32") {
      if (process.env.PORTABLE_EXECUTABLE_FILE) return "Portable builds must be replaced manually.";
      try {
        const files = await fs.readdir(path.dirname(app.getPath("exe")));
        if (!files.some((name) => /^Uninstall .*\.exe$/i.test(name)))
          return "Use the NSIS installer to enable in-app updates. ZIP builds must be replaced manually.";
        const config = await fs.readFile(
          path.join(process.resourcesPath, "app-update.yml"),
          "utf8",
        );
        const lines = config.split(/\r?\n/);
        const publisherIndex = lines.findIndex((line) => line.startsWith("publisherName:"));
        const scalar = lines[publisherIndex]?.slice("publisherName:".length).trim() ?? "";
        const listItem = lines[publisherIndex + 1]?.match(/^[ \t]+-[ \t]+(.+)$/)?.[1]?.trim() ?? "";
        const publisher = publisherIndex >= 0 ? scalar || listItem : "";
        if (!publisher || /^(?:null|~|\[\]|\{\}|''|""|#)/i.test(publisher))
          return "This Windows build has no configured signing publisher. Download the matching installer manually.";
      } catch {
        return "Installer update configuration is unavailable. Download the matching installer manually.";
      }
      return undefined;
    }
    return "Use the release page to update this operating system.";
  }

  check(): Promise<UpdateState> {
    if (this.pending) return this.pending;
    if (["downloading", "downloaded", "installing"].includes(this.state.status))
      return Promise.resolve(this.state);
    if (
      this.state.status !== "idle" &&
      this.state.status !== "error" &&
      Date.now() - this.lastCheck < 15_000
    )
      return Promise.resolve(this.state);
    this.lastCheck = Date.now();
    this.pending = this.performCheck().finally(() => {
      this.pending = undefined;
    });
    return this.pending;
  }

  private async performCheck(): Promise<UpdateState> {
    this.publish({ status: "checking", message: "Checking for updates…", releaseUrl });
    try {
      const limitation = await this.capability();
      this.publish({
        ...this.state,
        installSupported: !limitation,
        ...(limitation ? { limitation } : {}),
      });
      if (!limitation) {
        this.configure();
        const result = await autoUpdater.checkForUpdates();
        if (!result) throw new Error("Updater unavailable");
        return this.state;
      }
      const response = await fetch(releaseApiUrl, {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": `Hosts-Editor/${app.getVersion()}`,
        },
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error(`GitHub returned HTTP ${String(response.status)}`);
      const release = releaseSchema.parse(await response.json());
      const version = release.tag_name.replace(/^v/, "");
      const downloadUrl = selectReleaseAsset(release.assets, process.platform, process.arch);
      const available =
        !release.draft && !release.prerelease && isNewerVersion(version, app.getVersion());
      return this.publish({
        ...this.state,
        status: available ? "available" : "current",
        version: available ? version : app.getVersion(),
        releaseUrl: safeReleaseUrl(release.html_url),
        ...(downloadUrl ? { downloadUrl } : {}),
        message: available ? `Version ${version} is available.` : "Hosts Editor is up to date.",
      });
    } catch (error: unknown) {
      return this.fail(error);
    }
  }

  async download(): Promise<UpdateState> {
    if (this.state.status !== "available" || !this.state.installSupported || this.pending)
      return this.state;
    this.publish({ ...this.state, status: "downloading", message: "Starting download…" });
    this.pending = autoUpdater
      .downloadUpdate()
      .then(() => this.state)
      .catch((error: unknown) => this.fail(error))
      .finally(() => {
        this.pending = undefined;
      });
    return this.pending;
  }

  install(): UpdateState {
    if (this.state.status !== "downloaded" || !this.state.installSupported)
      throw new Error("No verified update is ready to install.");
    if (this.safety.dirty || this.safety.busy)
      throw new Error("Save or discard all unsaved changes before installing the update.");
    this.publish({ ...this.state, status: "installing", message: "Restarting to install update…" });
    setImmediate(() => {
      try {
        autoUpdater.quitAndInstall(false, true);
      } catch (error: unknown) {
        this.fail(error);
      }
    });
    return this.state;
  }

  async open(): Promise<void> {
    await shell.openExternal(
      safeReleaseUrl(this.state.downloadUrl ?? this.state.releaseUrl ?? releaseUrl),
    );
  }
}
