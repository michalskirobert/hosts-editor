"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("electronAPI", {
    readHosts: () => electron_1.ipcRenderer.invoke("read-hosts"),
    readHostsRaw: () => electron_1.ipcRenderer.invoke("read-hosts-raw"),
    writeHosts: (lines) => electron_1.ipcRenderer.invoke("write-hosts", lines),
});
//# sourceMappingURL=preload.js.map