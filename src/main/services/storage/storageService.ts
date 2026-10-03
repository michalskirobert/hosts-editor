import { app, dialog, shell } from "electron";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import AdmZip from "adm-zip";
import { z } from "zod";

import { parseHostsText } from "../../../shared/domain/hosts";
import type {
  AppSettings,
  BackupImportResult,
  BackupInfo,
  BackupReason,
  BackupSnapshot,
  HostTab,
} from "../../../shared/types";

const defaults: AppSettings = {
  theme: "system",
  fullscreen: false,
  checkForUpdates: true,
  autoBackupOnSave: true,
};

interface StoredBackup {
  readonly reason: BackupReason;
  readonly createdAt: string;
  readonly tab: HostTab;
}

const hostLineSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["host", "comment", "blank", "raw"]),
  enabled: z.boolean(),
  address: z.string(),
  hostname: z.string(),
  comment: z.string(),
  raw: z.string(),
});

const hostTabSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  enabled: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  lines: z.array(hostLineSchema),
});

const storedBackupSchema = z.object({
  reason: z.enum(["auto-save", "manual", "pre-restore", "pre-import", "pre-delete"]),
  createdAt: z.iso.datetime(),
  tab: hostTabSchema,
});

const backupArchiveManifestSchema = z.object({
  format: z.literal("hosts-editor-backup-archive"),
  formatVersion: z.literal(1),
  createdAt: z.iso.datetime(),
  backupCount: z.number().int().nonnegative(),
});

const MAX_ARCHIVE_BYTES = 20 * 1024 * 1024;
const MAX_BACKUP_BYTES = 2 * 1024 * 1024;
const MAX_ARCHIVE_BACKUPS = 200;

export class StorageService {
  private readonly root = path.join(app.getPath("userData"), "v2");
  private readonly tabsDirectory = path.join(this.root, "tabs");
  private readonly backupsDirectory = path.join(this.root, "backups");
  private readonly settingsPath = path.join(this.root, "settings.json");

  async init(): Promise<void> {
    await Promise.all([
      fs.mkdir(this.tabsDirectory, { recursive: true }),
      fs.mkdir(this.backupsDirectory, { recursive: true }),
    ]);
    try {
      await fs.access(this.settingsPath);
    } catch {
      await this.atomicJson(this.settingsPath, defaults);
    }
  }

  async getSettings(): Promise<AppSettings> {
    try {
      return { ...defaults, ...(await this.read<AppSettings>(this.settingsPath)) };
    } catch {
      return defaults;
    }
  }

  async saveSettings(value: AppSettings): Promise<void> {
    await this.atomicJson(this.settingsPath, value);
  }

  async listTabs(): Promise<readonly HostTab[]> {
    const names = (await fs.readdir(this.tabsDirectory)).filter((name) => name.endsWith(".json"));
    const tabs = await Promise.all(
      names.map((name) => this.read<HostTab>(path.join(this.tabsDirectory, name))),
    );
    return tabs.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async createTab(name = "New tab", text = ""): Promise<HostTab> {
    const now = new Date().toISOString();
    const tab: HostTab = {
      id: randomUUID(),
      name: this.normalizeName(name),
      enabled: true,
      createdAt: now,
      updatedAt: now,
      lines: parseHostsText(text),
    };
    await this.atomicJson(this.tabPath(tab.id), tab);
    return tab;
  }

  async saveTab(tab: HostTab, createAutoBackup = false): Promise<HostTab> {
    const existing = await this.tryReadTab(tab.id);
    if (existing && createAutoBackup && !(await this.hasAutoBackupToday(tab.id))) {
      await this.createBackup(existing, "auto-save");
      await this.pruneAutoBackups(7);
    }
    const next: HostTab = {
      ...tab,
      name: this.normalizeName(tab.name),
      updatedAt: new Date().toISOString(),
    };
    await this.atomicJson(this.tabPath(next.id), next);
    return next;
  }

  async deleteTab(id: string, deleteBackups: boolean): Promise<void> {
    const existing = await this.tryReadTab(id);
    if (existing && !deleteBackups) await this.createBackup(existing, "pre-delete");
    await fs.rm(this.tabPath(id), { force: true });
    if (deleteBackups)
      await fs.rm(path.join(this.backupsDirectory, this.safeId(id)), {
        recursive: true,
        force: true,
      });
  }

  async createBackup(tab: HostTab, reason: BackupReason = "manual"): Promise<BackupInfo> {
    const directory = path.join(this.backupsDirectory, this.safeId(tab.id));
    await fs.mkdir(directory, { recursive: true });
    const createdAt = new Date().toISOString();
    const fileName = `${createdAt.replace(/[:.]/g, "-")}-${reason}.json`;
    const backupPath = path.join(directory, fileName);
    const stored: StoredBackup = { reason, createdAt, tab };
    await this.atomicJson(backupPath, stored);
    return { tabId: tab.id, fileName, createdAt, path: backupPath, reason };
  }

  private async hasAutoBackupToday(tabId: string): Promise<boolean> {
    const directory = path.join(this.backupsDirectory, this.safeId(tabId));
    const files = await fs.readdir(directory).catch((): string[] => []);
    const today = new Date().toISOString().slice(0, 10);

    for (const fileName of files) {
      if (!fileName.endsWith(".json")) continue;
      try {
        const stored = await this.read<StoredBackup>(path.join(directory, fileName));
        if (stored.reason === "auto-save" && stored.createdAt.slice(0, 10) === today) return true;
      } catch {
        // Ignore malformed legacy backup files here. listBackups handles them separately.
      }
    }
    return false;
  }

  private async pruneAutoBackups(limit: number): Promise<void> {
    const backups = (await this.listBackups()).filter((backup) => backup.reason === "auto-save");
    await Promise.all(backups.slice(limit).map((backup) => fs.rm(backup.path, { force: true })));
  }

  async listBackups(): Promise<readonly BackupInfo[]> {
    const ids = await fs.readdir(this.backupsDirectory).catch((): string[] => []);
    const all: BackupInfo[] = [];
    for (const id of ids) {
      const directory = path.join(this.backupsDirectory, id);
      for (const fileName of await fs.readdir(directory).catch((): string[] => [])) {
        if (!fileName.endsWith(".json")) continue;
        const backupPath = path.join(directory, fileName);
        try {
          const stored = await this.read<StoredBackup>(backupPath);
          all.push({
            tabId: stored.tab.id,
            fileName,
            createdAt: stored.createdAt,
            path: backupPath,
            reason: stored.reason,
          });
        } catch {
          const stat = await fs.stat(backupPath);
          all.push({
            tabId: id,
            fileName,
            createdAt: stat.mtime.toISOString(),
            path: backupPath,
            reason: "auto-save",
          });
        }
      }
    }
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async readBackup(info: BackupInfo): Promise<BackupSnapshot> {
    const stored = await this.readBackupFile(info.path);
    return {
      info: { ...info, reason: stored.reason, createdAt: stored.createdAt, tabId: stored.tab.id },
      tab: stored.tab,
    };
  }

  async restoreBackup(info: BackupInfo): Promise<HostTab> {
    const stored = await this.readBackupFile(info.path);
    const current = await this.tryReadTab(stored.tab.id);
    if (current) await this.createBackup(current, "pre-restore");
    const restored: HostTab = { ...stored.tab, updatedAt: new Date().toISOString() };
    await this.atomicJson(this.tabPath(restored.id), restored);
    return restored;
  }

  async deleteBackup(info: BackupInfo): Promise<void> {
    await fs.rm(info.path, { force: true });
  }

  async exportBackup(info: BackupInfo): Promise<boolean> {
    const result = await dialog.showSaveDialog({
      title: "Export backup",
      defaultPath: info.fileName,
      filters: [{ name: "JSON", extensions: ["json"] }],
    });
    if (result.canceled || !result.filePath) return false;
    await fs.copyFile(info.path, result.filePath);
    return true;
  }

  async exportAllBackups(): Promise<boolean> {
    const backups = await this.listBackups();
    if (!backups.length) return false;

    const result = await dialog.showSaveDialog({
      title: "Export all backups",
      defaultPath: `hosts-editor-backups-${new Date().toISOString().slice(0, 10)}.zip`,
      filters: [{ name: "Hosts Editor backup archive", extensions: ["zip"] }],
    });
    if (result.canceled || !result.filePath) return false;

    const archive = new AdmZip();
    archive.addFile(
      "manifest.json",
      Buffer.from(
        `${JSON.stringify(
          {
            format: "hosts-editor-backup-archive",
            formatVersion: 1,
            createdAt: new Date().toISOString(),
            backupCount: backups.length,
          },
          null,
          2,
        )}\n`,
        "utf8",
      ),
    );

    for (const [index, backup] of backups.entries()) {
      const stored = await this.readBackupFile(backup.path);
      const safeName = `${String(index + 1).padStart(3, "0")}-${this.safeId(stored.tab.name)}-${backup.fileName}`;
      archive.addFile(
        `backups/${safeName}`,
        Buffer.from(`${JSON.stringify(stored, null, 2)}\n`, "utf8"),
      );
    }

    await fs.writeFile(result.filePath, archive.toBuffer());
    return true;
  }

  async importBackups(): Promise<BackupImportResult | null> {
    const result = await dialog.showOpenDialog({
      title: "Import backups",
      properties: ["openFile"],
      filters: [{ name: "Hosts Editor backups", extensions: ["json", "zip"] }],
    });
    const filePath = result.filePaths[0];
    if (result.canceled || !filePath) return null;

    const stat = await fs.stat(filePath);
    if (stat.size > MAX_ARCHIVE_BYTES) throw new Error("Backup file is too large.");

    const sourceName = path.basename(filePath);
    const extension = path.extname(filePath).toLowerCase();
    const candidates: StoredBackup[] = [];

    if (extension === ".json") {
      candidates.push(this.parseImportedBackup(await fs.readFile(filePath, "utf8")));
    } else if (extension === ".zip") {
      const archive = new AdmZip(filePath);
      const manifestEntry = archive.getEntry("manifest.json");
      if (!manifestEntry) throw new Error("This is not a Hosts Editor backup archive.");

      const manifestValue: unknown = JSON.parse(manifestEntry.getData().toString("utf8"));
      backupArchiveManifestSchema.parse(manifestValue);

      const entries = archive
        .getEntries()
        .filter(
          (entry) =>
            !entry.isDirectory &&
            entry.entryName.startsWith("backups/") &&
            entry.entryName.endsWith(".json"),
        );

      if (entries.length > MAX_ARCHIVE_BACKUPS) {
        throw new Error("Backup archive contains too many files.");
      }

      for (const entry of entries) {
        const bytes = entry.getData();
        if (bytes.byteLength > MAX_BACKUP_BYTES) {
          throw new Error("A backup inside the archive is too large.");
        }
        candidates.push(this.parseImportedBackup(bytes.toString("utf8")));
      }
    } else {
      throw new Error("Choose a JSON backup or Hosts Editor ZIP archive.");
    }

    let imported = 0;
    let skipped = 0;
    const existing = await this.listBackups();
    const fingerprints = new Set(
      await Promise.all(
        existing.map(async (backup) =>
          this.backupFingerprint(await this.readBackupFile(backup.path)),
        ),
      ),
    );

    for (const stored of candidates) {
      const fingerprint = this.backupFingerprint(stored);
      if (fingerprints.has(fingerprint)) {
        skipped += 1;
        continue;
      }
      await this.importStoredBackup(stored);
      fingerprints.add(fingerprint);
      imported += 1;
    }

    return { imported, skipped, sourceName };
  }

  async openBackups(): Promise<void> {
    await shell.openPath(this.backupsDirectory);
  }

  private parseImportedBackup(raw: string): StoredBackup {
    const value: unknown = JSON.parse(raw);
    const current = storedBackupSchema.safeParse(value);
    if (current.success) return current.data;
    const legacy = hostTabSchema.safeParse(value);
    if (legacy.success)
      return { reason: "manual", createdAt: legacy.data.updatedAt, tab: legacy.data };
    throw new Error("Invalid Hosts Editor backup file.");
  }

  private async importStoredBackup(stored: StoredBackup): Promise<void> {
    const directory = path.join(this.backupsDirectory, this.safeId(stored.tab.id));
    await fs.mkdir(directory, { recursive: true });
    const fileName = `${stored.createdAt.replace(/[:.]/g, "-")}-imported.json`;
    await this.atomicJson(path.join(directory, fileName), { ...stored, reason: "manual" });
  }

  private backupFingerprint(stored: StoredBackup): string {
    return JSON.stringify({
      tabId: stored.tab.id,
      createdAt: stored.createdAt,
      lines: stored.tab.lines,
    });
  }

  private async readBackupFile(backupPath: string): Promise<StoredBackup> {
    const value = await this.read<StoredBackup | HostTab>(backupPath);
    if ("tab" in value) return value;
    return { reason: "auto-save", createdAt: value.updatedAt, tab: value };
  }

  private async tryReadTab(id: string): Promise<HostTab | undefined> {
    try {
      return await this.read<HostTab>(this.tabPath(id));
    } catch {
      return undefined;
    }
  }

  private normalizeName(name: string): string {
    return name.trim() || "Untitled tab";
  }
  private safeId(id: string): string {
    return id.replace(/[^a-zA-Z0-9_-]/g, "-");
  }
  private tabPath(id: string): string {
    return path.join(this.tabsDirectory, `${this.safeId(id)}.json`);
  }
  private async read<T>(filePath: string): Promise<T> {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
  }
  private async atomicJson(filePath: string, value: unknown): Promise<void> {
    const tempPath = `${filePath}.${String(process.pid)}.tmp`;
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    await fs.rename(tempPath, filePath);
  }
}
