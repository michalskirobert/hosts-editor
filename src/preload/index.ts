import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";

import { IPC } from "../shared/contracts/ipc";
import type {
  AppSettings,
  BackupImportResult,
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
  exportAllBackups: () => ipcRenderer.invoke(IPC.backupsExportAll) as Promise<boolean>,
  importBackups: () => ipcRenderer.invoke(IPC.backupsImport) as Promise<BackupImportResult | null>,
  openBackups: () => ipcRenderer.invoke(IPC.backupsOpen) as Promise<void>,
  saveSettings: (settings) =>
    ipcRenderer.invoke(IPC.settingsSave, settings) as Promise<AppSettings>,
  dismissUpdateNotice: (version) =>
    ipcRenderer.invoke(IPC.updateDismissNotice, version) as Promise<UpdateState>,
  checkUpdate: () => ipcRenderer.invoke(IPC.updateCheck) as Promise<UpdateState>,
  getUpdateState: () => ipcRenderer.invoke(IPC.updateGetState) as Promise<UpdateState>,
  onUpdateState: (listener) => {
    const handler = (_event: IpcRendererEvent, state: UpdateState): void => {
      listener(state);
    };
    ipcRenderer.on(IPC.updateStateChanged, handler);
    return () => {
      ipcRenderer.removeListener(IPC.updateStateChanged, handler);
    };
  },
  downloadUpdate: () => ipcRenderer.invoke(IPC.updateDownload) as Promise<UpdateState>,
  installUpdate: () => ipcRenderer.invoke(IPC.updateInstall) as Promise<UpdateState>,
  setUpdateSafety: (dirty, busy) =>
    ipcRenderer.invoke(IPC.updateSafety, dirty, busy) as Promise<void>,
  cancelUpdate: () => ipcRenderer.invoke(IPC.updateCancel) as Promise<UpdateState>,
  showUpdateInFolder: () => ipcRenderer.invoke(IPC.updateShowInFolder) as Promise<void>,
  openUpdate: () => ipcRenderer.invoke(IPC.updateOpen) as Promise<void>,
  setFullscreen: (value) => ipcRenderer.invoke(IPC.fullscreen, value) as Promise<void>,
  openExternal: (url) => ipcRenderer.invoke(IPC.externalOpen, url) as Promise<void>,
  getFeedbackCaptcha: () =>
    ipcRenderer.invoke(IPC.feedbackCaptcha) as Promise<FeedbackCaptchaResult>,
  submitFeedback: (payload) =>
    ipcRenderer.invoke(IPC.feedbackSubmit, payload) as Promise<FeedbackSubmitResult>,
};

contextBridge.exposeInMainWorld("hostsEditor", api);
