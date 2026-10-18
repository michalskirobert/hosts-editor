import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import semver from "semver";
import { z } from "zod";
import { assetSchema, normalizedVersion, sha256Digest, validateDownloadUrl } from "./release";
import type { ReleaseAsset } from "./release";

const entrySchema = z.object({
  version: z.string().refine((value) => semver.valid(value) !== null),
  asset: assetSchema,
  completed: z.boolean().default(false),
});
const indexSchema = z.object({ format: z.literal(1), entries: z.array(entrySchema).max(256) });
type Entry = z.infer<typeof entrySchema>;

export class InstallerRegistry {
  private entries: Entry[] = [];
  private canonicalRoot = "";
  private readonly index: string;

  constructor(private readonly root: string) {
    this.index = path.join(path.dirname(root), "installer-index.json");
  }

  private name(asset: ReleaseAsset): string {
    if (
      path.basename(asset.name) !== asset.name ||
      /[/\\\0]/.test(asset.name) ||
      !/\.(dmg|exe|zip|AppImage|deb)$/.test(asset.name)
    )
      throw new Error("Invalid tracked installer name.");
    return `${String(asset.id)}-${asset.name}`;
  }

  async init(): Promise<void> {
    if ((await fs.lstat(this.root)).isSymbolicLink())
      throw new Error("The update directory must not be a symbolic link.");
    this.canonicalRoot = await fs.realpath(this.root);
    try {
      const stat = await fs.lstat(this.index);
      if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 1024 * 1024)
        throw new Error("Invalid installer index.");
      const index = indexSchema.parse(JSON.parse(await fs.readFile(this.index, "utf8")));
      for (const entry of index.entries) {
        this.name(entry.asset);
        this.version(entry.asset, entry.version);
      }
      this.entries = index.entries;
    } catch (error: unknown) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) {
        console.warn("Update installer index was not loaded; untracked files will be preserved.");
        throw new Error("The update file index could not be read safely.");
      }
    }
  }

  private version(asset: ReleaseAsset, expected?: string): string {
    sha256Digest(asset);
    const url = new URL(validateDownloadUrl(asset.browser_download_url));
    const parts = url.pathname.split("/");
    if (decodeURIComponent(parts.at(-1) ?? "") !== asset.name)
      throw new Error("Tracked installer metadata does not match its filename.");
    const version = normalizedVersion(decodeURIComponent(parts.at(-2) ?? ""));
    if (expected && version !== normalizedVersion(expected))
      throw new Error("Tracked installer version does not match.");
    return version;
  }

  private async persist(): Promise<void> {
    const temporary = `${this.index}.${randomUUID()}.tmp`;
    try {
      await fs.writeFile(temporary, JSON.stringify({ format: 1, entries: this.entries }), {
        flag: "wx",
        mode: 0o600,
      });
      await fs.rename(temporary, this.index);
    } finally {
      await fs.rm(temporary, { force: true });
    }
  }

  owns(asset: ReleaseAsset): boolean {
    return this.entries.some(
      (entry) =>
        entry.completed &&
        entry.asset.id === asset.id &&
        entry.asset.name === asset.name &&
        entry.asset.digest === asset.digest,
    );
  }

  async track(asset: ReleaseAsset, completed = false): Promise<void> {
    this.name(asset);
    const version = this.version(asset);
    const previous = this.entries;
    this.entries = [
      ...previous.filter((entry) => entry.asset.id !== asset.id),
      { version, asset, completed },
    ];
    if (this.entries.length > 256) {
      this.entries = previous;
      throw new Error("The update file index is full.");
    }
    try {
      await this.persist();
    } catch (error: unknown) {
      this.entries = previous;
      throw error;
    }
  }

  private async remove(name: string): Promise<void> {
    if (name !== path.basename(name) || /[/\\\0]/.test(name))
      throw new Error("Unsafe cleanup destination.");
    if ((await fs.realpath(this.root)) !== this.canonicalRoot)
      throw new Error("The update directory changed during cleanup.");
    const file = path.join(this.root, name);
    try {
      const stat = await fs.lstat(file);
      if (!stat.isFile() || stat.isSymbolicLink())
        throw new Error("Cleanup refused a non-regular update file.");
      await fs.unlink(file);
    } catch (error: unknown) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
    }
  }

  async cleanup(runningVersion?: string): Promise<void> {
    const retained: Entry[] = [];
    for (const entry of this.entries) {
      try {
        const name = this.name(entry.asset);
        await this.remove(`${name}.part`);
        if (runningVersion && semver.gte(normalizedVersion(runningVersion), entry.version)) {
          if (entry.completed) await this.remove(name);
        } else {
          retained.push(entry);
          continue;
        }
      } catch {
        console.warn("An application-managed installer could not be cleaned; it will be retried.");
        retained.push(entry);
      }
    }
    this.entries = retained;
    await this.persist();
  }
}
