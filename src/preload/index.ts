import { contextBridge, ipcRenderer } from "electron";

import { IPC } from "../shared/contracts/ipc";
import type {
  AppSettings,
  BackupInfo,
  BackupSnapshot,
  BootstrapPayload,
  FeedbackCaptchaResult,
  FeedbackSubmitResult,
  HostTab,
  UpdateState,
} from "../shared/types";
import type { HostsEditorApi } from "../shared/hostsEditorApi";

const api: HostsEditorApi = {
  bootstrap: () => ipcRenderer.invoke(IPC.bootstrap) as Promise<BootstrapPayload>,
  createTab: (name, text) => ipcRenderer.invoke(IPC.tabCreate, name, text) as Promise<HostTab>,
  saveTab: (tab) => ipcRenderer.invoke(IPC.tabSave, tab) as Promise<HostTab>,
  deleteTab: (id, deleteBackups) =>
    ipcRenderer.invoke(IPC.tabDelete, id, deleteBackups) as Promise<void>,
  importHosts: () => ipcRenderer.invoke(IPC.hostsImport) as Promise<string>,
  saveTabAndApply: (tab) => ipcRenderer.invoke(IPC.tabSaveAndApply, tab) as Promise<HostTab>,
  listBackups: () => ipcRenderer.invoke(IPC.backupsList) as Promise<readonly BackupInfo[]>,
  createBackup: (tab, reason = "manual") =>
    ipcRenderer.invoke(IPC.backupsCreate, tab, reason) as Promise<BackupInfo>,
  readBackup: (backup) => ipcRenderer.invoke(IPC.backupsRead, backup) as Promise<BackupSnapshot>,
  restoreBackup: (backup) => ipcRenderer.invoke(IPC.backupsRestore, backup) as Promise<HostTab>,
  deleteBackup: (backup) => ipcRenderer.invoke(IPC.backupsDelete, backup) as Promise<void>,
  exportBackup: (backup) => ipcRenderer.invoke(IPC.backupsExport, backup) as Promise<boolean>,
  openBackups: () => ipcRenderer.invoke(IPC.backupsOpen) as Promise<void>,
  saveSettings: (settings) =>
    ipcRenderer.invoke(IPC.settingsSave, settings) as Promise<AppSettings>,
  checkUpdate: () => ipcRenderer.invoke(IPC.updateCheck) as Promise<UpdateState>,
  openUpdate: () => ipcRenderer.invoke(IPC.updateOpen) as Promise<void>,
  setFullscreen: (value) => ipcRenderer.invoke(IPC.fullscreen, value) as Promise<void>,
  openExternal: (url) => ipcRenderer.invoke(IPC.externalOpen, url) as Promise<void>,
  getFeedbackCaptcha: () =>
    ipcRenderer.invoke(IPC.feedbackCaptcha) as Promise<FeedbackCaptchaResult>,
  submitFeedback: (payload) =>
    ipcRenderer.invoke(IPC.feedbackSubmit, payload) as Promise<FeedbackSubmitResult>,
};

contextBridge.exposeInMainWorld("hostsEditor", api);
