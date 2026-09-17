import { app, BrowserWindow, ipcMain, nativeTheme } from "electron";

import { IPC } from "../../shared/contracts/ipc";
import type { AppSettings, BackupInfo, BackupReason, HostTab } from "../../shared/types";
import type { HostsService } from "../services/hosts/hostsService";
import type { StorageService } from "../services/storage/storageService";
import type { UpdateService } from "../services/update/updateService";

export const registerIpc = (
  storage: StorageService,
  hosts: HostsService,
  updates: UpdateService,
): void => {
  ipcMain.handle(IPC.bootstrap, async () => ({
    tabs: await storage.listTabs(),
    settings: await storage.getSettings(),
    hostsPath: hosts.path(),
    version: app.getVersion(),
  }));
  ipcMain.handle(IPC.tabCreate, (_event, name: string, text: string) =>
    storage.createTab(name, text),
  );
  ipcMain.handle(IPC.tabSave, (_event, tab: HostTab) => storage.saveTab(tab, false));
  ipcMain.handle(IPC.tabDelete, (_event, id: string, deleteBackups: boolean) =>
    storage.deleteTab(id, deleteBackups),
  );
  ipcMain.handle(IPC.hostsImport, () => hosts.read());
  ipcMain.handle(IPC.tabSaveAndApply, async (_event, tab: HostTab) => {
    const saved = await storage.saveTab(tab);
    await hosts.apply(await storage.listTabs());
    return saved;
  });
  ipcMain.handle(IPC.backupsList, () => storage.listBackups());
  ipcMain.handle(IPC.backupsCreate, (_event, tab: HostTab, reason: BackupReason) =>
    storage.createBackup(tab, reason),
  );
  ipcMain.handle(IPC.backupsRead, (_event, backup: BackupInfo) => storage.readBackup(backup));
  ipcMain.handle(IPC.backupsRestore, (_event, backup: BackupInfo) => storage.restoreBackup(backup));
  ipcMain.handle(IPC.backupsDelete, (_event, backup: BackupInfo) => storage.deleteBackup(backup));
  ipcMain.handle(IPC.backupsExport, (_event, backup: BackupInfo) => storage.exportBackup(backup));
  ipcMain.handle(IPC.backupsOpen, () => storage.openBackups());
  ipcMain.handle(IPC.settingsSave, async (_event, settings: AppSettings) => {
    await storage.saveSettings(settings);
    nativeTheme.themeSource = settings.theme;
    return settings;
  });
  ipcMain.handle(IPC.updateCheck, () => updates.check());
  ipcMain.handle(IPC.updateOpen, () => updates.open());
  ipcMain.handle(IPC.fullscreen, (_event, value: boolean) =>
    BrowserWindow.getFocusedWindow()?.setFullScreen(value),
  );
};
