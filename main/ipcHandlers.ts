import { ipcMain, app } from "electron";
import fs from "fs";
import path from "path";
import sudo from "sudo-prompt";
import { Settings } from "./settings.types";

const defaultSettingsPath = app.isPackaged
  ? path.join(app.getAppPath(), "dist/web/settings.json")
  : path.join(__dirname, "../public/settings.json");

const userSettingsPath = path.join(app.getPath("userData"), "settings.json");

export function registerIpcHandlers() {
  const hostsPath =
    process.platform === "win32"
      ? path.join(
          process.env.SystemRoot || "C:\\Windows",
          "System32",
          "drivers",
          "etc",
          "hosts",
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

  ipcMain.handle("read-settings", async () => {
    try {
      if (!fs.existsSync(userSettingsPath)) {
        const defaults = fs.readFileSync(defaultSettingsPath, "utf-8");

        fs.writeFileSync(userSettingsPath, defaults, "utf-8");

        return JSON.parse(defaults);
      }

      const res = fs.readFileSync(userSettingsPath, "utf-8");
      return JSON.parse(res);
    } catch (err) {
      return { error: String(err) };
    }
  });

  ipcMain.handle("update-settings", async (_event, data: Settings) => {
    try {
      fs.writeFileSync(
        userSettingsPath,
        JSON.stringify(data, null, 2),
        "utf-8",
      );

      return true;
    } catch (err) {
      return false;
    }
  });

  ipcMain.handle("write-hosts", async (_event, lines: string[]) => {
    return new Promise((resolve, reject) => {
      const content = lines.join("\n");

      let cmd = "";
      let options: { name: string; password?: string } = {
        name: "Hosts Editor",
      };

      if (process.platform === "darwin" || process.platform === "linux") {
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
}
