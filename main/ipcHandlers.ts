import { ipcMain, BrowserWindow } from "electron";
import fs from "fs";
import path from "path";
import sudo from "sudo-prompt";

export function registerIpcHandlers(mainWindow: BrowserWindow) {
  const hostsPath =
    process.platform === "win32"
      ? path.join(
          process.env.SystemRoot || "C:\\Windows",
          "System32",
          "drivers",
          "etc",
          "hosts"
        )
      : "/etc/hosts";

  let sessionPassword: string | null = null;

  ipcMain.handle("read-hosts", async () => {
    try {
      const content = fs.readFileSync(hostsPath, "utf-8");
      return content.split("\n");
    } catch (err) {
      return [`# ERROR: ${err}`];
    }
  });

  ipcMain.handle("read-hosts-raw", async () => {
    try {
      return fs.readFileSync(hostsPath, "utf-8");
    } catch (err) {
      return `# ERROR: ${err}`;
    }
  });

  ipcMain.handle("set-password", (_event, pw: string) => {
    sessionPassword = pw;
    return true;
  });

  ipcMain.handle("write-hosts", async (_event, lines: string[]) => {
    return new Promise((resolve, reject) => {
      const content = lines.join("\n");

      let cmd = "";
      let options: { name: string; password?: string } = {
        name: "Hosts Editor",
      };

      if (process.platform === "darwin") {
        cmd = `echo "${content}" | sudo -S tee /etc/hosts`;
        if (sessionPassword) options.password = sessionPassword;
      } else {
        cmd = `echo "${content}" > C:\\Windows\\System32\\drivers\\etc\\hosts`;
      }

      sudo.exec(cmd, options, (err) => {
        if (err) return reject(err);
        resolve(true);
      });
    });
  });
  ipcMain.on("install-update", () => {
    const { autoUpdater } = require("electron-updater");
    try {
      autoUpdater.quitAndInstall();
    } catch (error) {
      mainWindow.webContents.send("toast", {
        type: "error",
        message: String(error),
      });
    }
  });
  ipcMain.on("check-for-updates", () => {
    const { autoUpdater } = require("electron-updater");
    autoUpdater
      .checkForUpdatesAndNotify()
      .then((result: any) => {
        if (result && result.updateInfo && result.updateInfo.version) {
        } else {
          mainWindow.webContents.send("toast", {
            type: "info",
            message: "You are up to date.",
          });
        }
      })
      .catch((err: any) => {
        mainWindow.webContents.send("toast", {
          type: "error",
          message: String(err),
        });
      });
  });
}
