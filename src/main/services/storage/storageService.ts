import { app, dialog, shell } from "electron";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { parseHostsText } from "../../../shared/domain/hosts";
import type {
  AppSettings,
  BackupInfo,
  BackupReason,
  BackupSnapshot,
  HostTab,
} from "../../../shared/types";

const defaults: AppSettings = {
  theme: "system",
  fullscreen: false,
  checkForUpdates: true,
  autoBackupOnSave: false,
};

interface StoredBackup {
  readonly reason: BackupReason;
  readonly createdAt: string;
  readonly tab: HostTab;
}

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
    if (existing && createAutoBackup) await this.createBackup(existing, "auto-save");
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

  async openBackups(): Promise<void> {
    await shell.openPath(this.backupsDirectory);
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
