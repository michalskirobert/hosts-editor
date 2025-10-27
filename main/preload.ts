import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  readHosts: () => ipcRenderer.invoke("read-hosts"),
  readHostsRaw: () => ipcRenderer.invoke("read-hosts-raw"),
  writeHosts: (lines: string[]) => ipcRenderer.invoke("write-hosts", lines),
  setPassword: (pw: string) => ipcRenderer.invoke("set-password", pw),
  onTriggerSave: (callback: () => void) => {
    ipcRenderer.on("trigger-save", callback);
  },
  removeTriggerSaveListener: (callback: () => void) => {
    ipcRenderer.removeListener("trigger-save", callback);
  },
});
