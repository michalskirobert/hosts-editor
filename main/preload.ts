import { contextBridge, ipcRenderer } from "electron";
import { Settings } from "./settings.types";

contextBridge.exposeInMainWorld("electronAPI", {
  readHosts: () => ipcRenderer.invoke("read-hosts"),
  readHostsRaw: () => ipcRenderer.invoke("read-hosts-raw"),
  writeHosts: (lines: string[]) => ipcRenderer.invoke("write-hosts", lines),
  setPassword: (pw: string) => ipcRenderer.invoke("set-password", pw),
  readSettings: () => ipcRenderer.invoke("read-settings"),
  updateSettings: (settings: Settings) =>
    ipcRenderer.invoke("update-settings", settings),
  toggleSettingsModal: (callback: () => void) =>
    ipcRenderer.on("toggle-settings-modal", callback),
  removeToggleSettingsModalListener: (callback: (...args: any[]) => void) => {
    ipcRenderer.removeListener("toggle-settings-modal", callback);
  },
  onTriggerSave: (callback: () => void) =>
    ipcRenderer.on("trigger-save", callback),
  removeTriggerSaveListener: (callback: (...args: any[]) => void) => {
    ipcRenderer.removeListener("trigger-save", callback);
  },
  onToast: (
    callback: (payload: {
      type: "success" | "error" | "info";
      message: string;
    }) => void,
  ) => {
    ipcRenderer.on("toast", (_event, payload) => callback(payload));
  },
  removeToastListener: (callback: (...args: any[]) => void) => {
    ipcRenderer.removeListener("toast", callback);
  },
});
