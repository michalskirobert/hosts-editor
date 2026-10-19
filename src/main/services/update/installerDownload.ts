import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { maxInstallerBytes, sha256Digest, validateDownloadUrl } from "./release";
import type { ReleaseAsset } from "./release";
import { InstallerRegistry } from "./installerRegistry";

const exec = promisify(execFile);
export interface InstallerProgress {
  readonly transferred: number;
  readonly total: number;
  readonly percent: number;
}
export class InstallerDownload {
  private registry: InstallerRegistry | undefined;
  constructor(
    private readonly root: string,
    private readonly platform = process.platform,
  ) {}

  async init(runningVersion?: string): Promise<void> {
    await fs.mkdir(this.root, { recursive: true, mode: 0o700 });
    this.registry = new InstallerRegistry(this.root);
    await this.registry.init();
    await this.registry.cleanup(runningVersion).catch(() => {
      console.warn("Update cleanup could not finish; startup will continue.");
    });
  }

  private async assertDirectory(): Promise<void> {
    if (!this.registry) throw new Error("The update directory is not initialized.");
    await this.registry.assertDirectory();
  }

  private async removeRegular(file: string): Promise<void> {
    if (path.dirname(file) !== this.root) throw new Error("Invalid cleanup location.");
    await this.assertDirectory();
    try {
      const stat = await fs.lstat(file);
      if (!stat.isFile() || stat.isSymbolicLink())
        throw new Error("Cleanup refused a non-regular update file.");
      await this.assertDirectory();
      await fs.unlink(file);
    } catch (error: unknown) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
    }
  }

  private destination(asset: ReleaseAsset): string {
    if (
      path.basename(asset.name) !== asset.name ||
      /[/\\\0]/.test(asset.name) ||
      !/\.(dmg|exe|zip|AppImage|deb)$/.test(asset.name)
    )
      throw new Error("Invalid installer filename.");
    return path.join(this.root, `${String(asset.id)}-${asset.name}`);
  }

  private async quarantine(file: string): Promise<void> {
    if (this.platform === "darwin") {
      const value = `0081;${Math.floor(Date.now() / 1000).toString(16)};Hosts Editor;`;
      await exec("/usr/bin/xattr", ["-w", "com.apple.quarantine", value, file]);
    }
  }

  async verify(file: string, asset: ReleaseAsset): Promise<void> {
    await this.assertDirectory();
    if (file !== this.destination(asset)) throw new Error("Invalid installer location.");
    const stat = await fs.lstat(file);
    if (
      !stat.isFile() ||
      stat.isSymbolicLink() ||
      stat.size !== asset.size ||
      stat.size > maxInstallerBytes
    )
      throw new Error("Installer size does not match the release.");
    const hash = createHash("sha256");
    for await (const chunk of createReadStream(file)) {
      if (!Buffer.isBuffer(chunk)) throw new Error("Invalid installer data.");
      hash.update(chunk);
    }
    if (hash.digest("hex") !== sha256Digest(asset))
      throw new Error("Installer checksum validation failed. Download the update again.");
    await this.validateFormat(file, asset.name);
    await this.assertDirectory();
    await this.quarantine(file);
  }

  private async validateFormat(file: string, name: string): Promise<void> {
    await this.assertDirectory();
    const handle = await fs.open(file, "r");
    try {
      const stat = await handle.stat();
      const header = Buffer.alloc(12),
        trailer = Buffer.alloc(4);
      await handle.read(header, 0, header.length, 0);
      const valid = name.endsWith(".dmg")
        ? stat.size >= 512 &&
          (await handle.read(trailer, 0, 4, stat.size - 512)).bytesRead === 4 &&
          trailer.toString() === "koly"
        : name.endsWith(".exe")
          ? header.subarray(0, 2).toString() === "MZ"
          : name.endsWith(".zip")
            ? ["504b0304", "504b0506", "504b0708"].includes(header.subarray(0, 4).toString("hex"))
            : name.endsWith(".deb")
              ? header.subarray(0, 8).toString() === "!<arch>\n"
              : header.subarray(0, 4).toString("hex") === "7f454c46" &&
                header.subarray(8, 11).toString("hex") === "414902";
      if (!valid)
        throw new Error("The downloaded file is not a valid installer for this package type.");
    } finally {
      await handle.close();
    }
  }

  async cached(asset: ReleaseAsset): Promise<string | undefined> {
    await this.assertDirectory();
    const file = this.destination(asset);
    try {
      await this.verify(file, asset);
    } catch {
      if (this.registry?.owns(asset)) {
        const stat = await fs.lstat(file).catch(() => undefined);
        if (stat?.isFile() && !stat.isSymbolicLink()) await this.removeRegular(file);
      }
      return undefined;
    }
    await this.registry?.track(asset, true);
    return file;
  }

  private async response(url: string, signal: AbortSignal): Promise<Response> {
    let current = validateDownloadUrl(url);
    for (let redirect = 0; redirect <= 5; redirect += 1) {
      const response = await fetch(current, {
        redirect: "manual",
        signal,
        headers: { Accept: "application/octet-stream", "Accept-Encoding": "identity" },
      });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        await response.body?.cancel();
        if (!location || redirect === 5)
          throw new Error("The installer download returned too many redirects.");
        current = validateDownloadUrl(new URL(location, current).toString(), true);
        continue;
      }
      if (!response.ok) {
        await response.body?.cancel();
        throw new Error(
          `Installer download failed (HTTP ${String(response.status)}). Please try again.`,
        );
      }
      return response;
    }
    throw new Error("Invalid download redirect.");
  }

  async download(
    asset: ReleaseAsset,
    signal: AbortSignal,
    progress: (value: InstallerProgress) => void,
  ): Promise<string> {
    await this.assertDirectory();
    sha256Digest(asset);
    const cached = await this.cached(asset);
    signal.throwIfAborted();
    if (cached) return cached;
    const file = this.destination(asset),
      partial = `${file}.part`;
    let owned = false;
    try {
      const disk = await fs.statfs(this.root);
      if (disk.bavail * disk.bsize < asset.size + 16 * 1024 * 1024)
        throw new Error("Not enough disk space to download the update.");
      await this.assertDirectory();
      const handle = await fs.open(partial, "wx", 0o600);
      owned = true;
      try {
        await this.registry?.track(asset);
        const response = await this.response(asset.browser_download_url, signal);
        if (!response.body) throw new Error("The update server returned an empty response.");
        const length = response.headers.get("content-length");
        if (length && Number(length) !== asset.size) {
          await response.body.cancel();
          throw new Error("Installer download size does not match the release.");
        }
        const reader = response.body.getReader();
        let transferred = 0,
          reported = 0;
        progress({ transferred, total: asset.size, percent: 0 });
        try {
          for (;;) {
            signal.throwIfAborted();
            const chunk = await reader.read();
            if (chunk.done) break;
            transferred += chunk.value.byteLength;
            if (transferred > asset.size || transferred > maxInstallerBytes)
              throw new Error("The installer exceeds its expected size.");
            let offset = 0;
            while (offset < chunk.value.byteLength) {
              const written = await handle.write(
                chunk.value,
                offset,
                chunk.value.byteLength - offset,
              );
              if (!written.bytesWritten)
                throw new Error("The installer could not be written to disk.");
              offset += written.bytesWritten;
            }
            if (Date.now() - reported >= 100 || transferred === asset.size) {
              progress({
                transferred,
                total: asset.size,
                percent: Math.min(100, (transferred / asset.size) * 100),
              });
              reported = Date.now();
            }
          }
          if (transferred !== asset.size)
            throw new Error("The installer download was interrupted. Please try again.");
          await handle.sync();
        } finally {
          await reader.cancel().catch(() => undefined);
          reader.releaseLock();
        }
      } finally {
        await handle.close();
      }
      signal.throwIfAborted();
      await this.assertDirectory();
      await fs.link(partial, file);
      try {
        await this.verify(file, asset);
      } catch (error: unknown) {
        await this.removeRegular(file);
        throw error;
      }
      if (this.platform === "linux" && file.endsWith(".AppImage")) {
        await this.assertDirectory();
        await fs.chmod(file, 0o700);
      }
      await this.registry?.track(asset, true);
      signal.throwIfAborted();
      return file;
    } finally {
      if (owned) await this.removeRegular(partial);
    }
  }
}
