import { app, BrowserWindow, shell } from "electron";
import updater from "electron-updater";
import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import { z } from "zod";

import { IPC } from "../../../shared/contracts/ipc";
import type { UpdateState } from "../../../shared/types";
import { InstallerDownload } from "./installerDownload";
import {
  isNewerVersion,
  normalizedVersion,
  releaseApiUrl,
  releaseSchema,
  releaseUrl,
  safeReleaseUrl,
  selectReleaseAssetInfo,
  sha256Digest,
} from "./release";
import type { ReleaseAsset } from "./release";

const { autoUpdater } = updater;
const failureMessage = (error: unknown): string => {
  if (error instanceof z.ZodError || error instanceof SyntaxError)
    return "The update service returned invalid release information. Please try again later.";
  const message = error instanceof Error ? error.message : "";
  if (message.includes("ENOSPC")) return "Not enough disk space to download the update.";
  if (/EACCES|EPERM|EROFS/.test(message))
    return "The update folder is not writable. Check its permissions and try again.";
  if (/fetch failed|network|socket|ECONN|ENOTFOUND|TimeoutError|timed? out/i.test(message))
    return "The update connection was interrupted or unavailable. Check your connection and try again.";
  return message || "The update could not be completed. Please try again.";
};

export class UpdateService {
  private state: UpdateState = { status: "idle", currentVersion: app.getVersion() };
  private pending: Promise<UpdateState> | undefined;
  private safety = { dirty: true, busy: true };
  private lastCheck = 0;
  private nextCheck = 0;
  private initialized = false;
  private prepared: Promise<void> | undefined;
  private downloader: InstallerDownload | undefined;
  private asset: ReleaseAsset | undefined;
  private installer: string | undefined;
  private controller: AbortController | undefined;
  private cancelled = false;
  private nativeCheck: Awaited<ReturnType<typeof autoUpdater.checkForUpdates>> | undefined;

  getState(): UpdateState {
    return this.state;
  }
  setSafety(dirty: boolean, busy: boolean): void {
    this.safety = { dirty, busy };
  }

  init(): Promise<void> {
    this.prepared ??= (async () => {
      this.downloader = new InstallerDownload(
        path.join(app.getPath("userData"), "updates", "installers"),
      );
      await this.downloader.init();
    })().catch((error: unknown) => {
      this.prepared = undefined;
      throw error;
    });
    return this.prepared;
  }

  private publish(value: UpdateState): UpdateState {
    this.state = { currentVersion: app.getVersion(), ...value };
    for (const window of BrowserWindow.getAllWindows()) {
      if (!window.isDestroyed()) window.webContents.send(IPC.updateStateChanged, this.state);
    }
    return this.state;
  }

  private fail(error: unknown): UpdateState {
    return this.publish({ ...this.state, status: "error", message: failureMessage(error) });
  }

  private configure(): void {
    if (this.initialized) return;
    this.initialized = true;
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = false;
    autoUpdater.allowPrerelease = false;
    autoUpdater.allowDowngrade = false;
    autoUpdater.on("download-progress", (progress) => {
      if (this.state.status !== "downloading" || this.cancelled) return;
      this.publish({
        ...this.state,
        progress: {
          percent: Math.min(100, Math.max(0, progress.percent)),
          transferred: progress.transferred,
          total: progress.total,
        },
      });
    });
    autoUpdater.on("update-downloaded", (info) => {
      if (
        this.state.status !== "downloading" ||
        this.cancelled ||
        info.version !== this.state.version
      )
        return;
      this.publish({
        ...this.state,
        status: "downloaded",
        message: `Hosts Editor ${info.version} is ready. Restart when you are ready to install.`,
      });
    });
    autoUpdater.on("error", (error) => {
      if (this.state.status === "downloading" && this.state.installSupported && !this.cancelled)
        this.fail(error);
    });
  }

  private async supportsNativeInstall(): Promise<boolean> {
    if (!app.isPackaged || !["x64", "arm64"].includes(process.arch)) return false;
    if (process.platform === "linux" && process.env.APPIMAGE) {
      try {
        await fs.access(process.env.APPIMAGE, fs.constants.W_OK);
        return true;
      } catch {
        return false;
      }
    }
    if (process.platform !== "win32" || process.env.PORTABLE_EXECUTABLE_FILE) return false;
    try {
      const files = await fs.readdir(path.dirname(app.getPath("exe")));
      if (!files.some((name) => /^Uninstall .*\.exe$/i.test(name))) return false;
      const value: unknown = yaml.load(
        await fs.readFile(path.join(process.resourcesPath, "app-update.yml"), "utf8"),
      );
      const config = z
        .object({
          publisherName: z.union([
            z.string().trim().min(1),
            z.array(z.string().trim().min(1)).min(1),
          ]),
        })
        .safeParse(value);
      return config.success;
    } catch {
      return false;
    }
  }

  check(): Promise<UpdateState> {
    if (this.pending) return this.pending;
    if (["downloaded", "installing"].includes(this.state.status))
      return Promise.resolve(this.state);
    if (Date.now() < this.nextCheck || (this.lastCheck > 0 && Date.now() - this.lastCheck < 15_000))
      return Promise.resolve(this.state);
    this.lastCheck = Date.now();
    this.pending = this.performCheck()
      .catch((error: unknown) => this.fail(error))
      .finally(() => {
        this.pending = undefined;
      });
    return this.pending;
  }

  private async performCheck(): Promise<UpdateState> {
    this.publish({ status: "checking", message: "Checking for updates…" });
    this.asset = undefined;
    this.installer = undefined;
    this.nativeCheck = undefined;
    await this.init();
    const response = await fetch(releaseApiUrl, {
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": `Hosts-Editor/${app.getVersion()}`,
      },
    });
    if ([403, 429].includes(response.status)) {
      const retry = Number(response.headers.get("retry-after"));
      const reset = Number(response.headers.get("x-ratelimit-reset")) * 1000;
      this.nextCheck = Math.min(
        Date.now() + 24 * 60 * 60 * 1000,
        Math.max(Date.now() + 60_000, retry > 0 ? Date.now() + retry * 1000 : reset),
      );
      throw new Error(
        "The update service is temporarily limiting requests. Please try again later.",
      );
    }
    if (!response.ok)
      throw new Error(
        response.status === 404
          ? "No published update is available from the update service."
          : `The update service returned HTTP ${String(response.status)}. Please try again later.`,
      );
    const release = releaseSchema.parse(await response.json());
    safeReleaseUrl(release.html_url);
    if (
      release.draft ||
      release.prerelease ||
      !isNewerVersion(release.tag_name, app.getVersion())
    ) {
      return this.publish({
        status: "current",
        version: app.getVersion(),
        message: "Hosts Editor is up to date.",
      });
    }
    const version = normalizedVersion(release.tag_name);
    this.asset = selectReleaseAssetInfo(
      release.assets,
      version,
      process.platform,
      process.arch,
      Boolean(process.env.APPIMAGE),
    );
    if (!this.asset)
      throw new Error(
        "This release has no compatible installer for your system and processor. Please try again after the release is updated.",
      );
    let native = await this.supportsNativeInstall();
    if (native) {
      this.configure();
      try {
        this.nativeCheck = await autoUpdater.checkForUpdates();
        native = Boolean(
          this.nativeCheck?.cancellationToken &&
          normalizedVersion(this.nativeCheck.updateInfo.version) === version,
        );
      } catch {
        native = false;
      }
    }
    if (!native) sha256Digest(this.asset);
    const available: UpdateState = {
      status: "available",
      version,
      installSupported: native,
      releaseUrl,
      packageType: this.asset.name.split(".").at(-1),
      message: `Hosts Editor ${version} is available.`,
    };
    if (!native && this.downloader) {
      const file = await this.downloader.cached(this.asset);
      if (file) {
        this.installer = file;
        return this.publish({
          ...available,
          status: "downloaded",
          message: `Hosts Editor ${version} is ready. Open the downloaded installer to continue.`,
        });
      }
    }
    return this.publish(available);
  }

  download(): Promise<UpdateState> {
    if (this.pending) return this.pending;
    if (
      this.state.status !== "available" &&
      this.state.status !== "cancelled" &&
      this.state.status !== "error"
    )
      return Promise.resolve(this.state);
    if (!this.asset || !this.state.version || !this.downloader) return Promise.resolve(this.state);
    this.cancelled = false;
    this.controller = new AbortController();
    const signal = AbortSignal.any([this.controller.signal, AbortSignal.timeout(30 * 60 * 1000)]);
    this.publish({
      ...this.state,
      status: "downloading",
      progress: { percent: 0, transferred: 0, total: this.asset.size },
      message: `Downloading Hosts Editor ${this.state.version}…`,
    });
    this.pending = this.performDownload(signal)
      .catch((error: unknown) =>
        this.cancelled
          ? this.publish({
              ...this.state,
              status: "cancelled",
              progress: undefined,
              message: "Download cancelled. You can download the update later.",
            })
          : this.fail(error),
      )
      .finally(() => {
        this.pending = undefined;
        this.controller = undefined;
      });
    return this.pending;
  }

  private async performDownload(signal: AbortSignal): Promise<UpdateState> {
    if (this.state.installSupported && this.nativeCheck) {
      if (this.nativeCheck.cancellationToken?.cancelled) {
        this.nativeCheck = await autoUpdater.checkForUpdates();
        if (
          !this.nativeCheck?.cancellationToken ||
          this.nativeCheck.updateInfo.version !== this.state.version
        )
          throw new Error("The update information changed. Check for updates again.");
      }
      signal.throwIfAborted();
      const token = this.nativeCheck.cancellationToken;
      const abort = (): void => {
        token?.cancel();
      };
      signal.addEventListener("abort", abort, { once: true });
      try {
        await autoUpdater.downloadUpdate(token);
      } finally {
        signal.removeEventListener("abort", abort);
      }
      if (this.cancelled) throw new Error("Cancelled");
      if (this.state.status !== "downloaded")
        throw new Error("The update download did not complete. Please try again.");
      return this.state;
    }
    if (!this.asset || !this.downloader) throw new Error("Check for updates before downloading.");
    this.installer = await this.downloader.download(this.asset, signal, (progress) => {
      if (!this.cancelled) this.publish({ ...this.state, progress });
    });
    signal.throwIfAborted();
    return this.publish({
      ...this.state,
      status: "downloaded",
      message: `Hosts Editor ${this.state.version ?? "update"} is ready. Open the downloaded installer to continue.`,
    });
  }

  async cancel(): Promise<UpdateState> {
    if (this.state.status !== "downloading") return this.state;
    this.cancelled = true;
    this.controller?.abort();
    if (this.state.installSupported) this.nativeCheck?.cancellationToken?.cancel();
    return this.pending ?? this.state;
  }

  install(): UpdateState {
    if (this.state.status !== "downloaded" || !this.state.installSupported)
      throw new Error("No automatic installation is available for this update.");
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

  private async verifiedInstaller(): Promise<string> {
    if (
      this.state.status !== "downloaded" ||
      this.state.installSupported ||
      !this.installer ||
      !this.asset ||
      !this.downloader
    )
      throw new Error("Download and verify an installer first.");
    try {
      await this.downloader.verify(this.installer, this.asset);
      return this.installer;
    } catch (error: unknown) {
      this.installer = undefined;
      this.fail(error);
      throw error;
    }
  }

  async open(): Promise<void> {
    const file = await this.verifiedInstaller();
    const message = await shell.openPath(file);
    if (message)
      throw new Error(
        process.platform === "darwin"
          ? "macOS could not open the installer. The system's security checks still apply. You can locate the downloaded file using Show in Folder."
          : "Your system could not open this package. Use Show in Folder and your system's package installer.",
      );
  }
  async showInFolder(): Promise<void> {
    shell.showItemInFolder(await this.verifiedInstaller());
  }
}
