"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const sudo_prompt_1 = __importDefault(require("sudo-prompt"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const hostsPath = process.platform === "win32"
    ? "C:\\Windows\\System32\\drivers\\etc\\hosts"
    : "/etc/hosts";
let mainWindow = null;
let sessionPassword = null;
const createWindow = () => {
    mainWindow = new electron_1.BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            preload: path_1.default.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    if (process.env.ELECTRON_START_URL) {
        mainWindow.loadURL(process.env.ELECTRON_START_URL);
    }
    else {
        mainWindow.loadFile(path_1.default.join(__dirname, "../dist/index.html"));
    }
    if (process.env.IS_LOCALHOST === "true") {
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.removeMenu();
        mainWindow.webContents.on("before-input-event", (event, input) => {
            if ((input.control || input.meta) &&
                input.shift &&
                input.key.toLowerCase() === "i") {
                event.preventDefault();
            }
            if (input.key === "F12")
                event.preventDefault();
        });
        mainWindow.webContents.on("context-menu", (e) => e.preventDefault());
    }
};
electron_1.app.on("ready", createWindow);
electron_1.ipcMain.handle("read-hosts", async () => {
    try {
        const content = fs_1.default.readFileSync(hostsPath, "utf-8");
        return content.split("\n");
    }
    catch (err) {
        return [`# ERROR: ${err}`];
    }
});
electron_1.ipcMain.handle("read-hosts-raw", async () => {
    try {
        return fs_1.default.readFileSync(hostsPath, "utf-8");
    }
    catch (err) {
        return `# ERROR: ${err}`;
    }
});
electron_1.ipcMain.handle("set-password", (_event, pw) => {
    sessionPassword = pw;
    return true;
});
electron_1.ipcMain.handle("write-hosts", async (_event, lines) => {
    return new Promise((resolve, reject) => {
        const content = lines.join("\n");
        let cmd = "";
        let options = { name: "Hosts Editor" };
        if (process.platform === "darwin") {
            cmd = `echo "${content}" | sudo -S tee /etc/hosts`;
            if (sessionPassword)
                options.password = sessionPassword;
        }
        else {
            cmd = `echo "${content}" > C:\\Windows\\System32\\drivers\\etc\\hosts`;
        }
        sudo_prompt_1.default.exec(cmd, options, (err) => {
            if (err)
                return reject(err);
            resolve(true);
        });
    });
});
//# sourceMappingURL=main.js.map