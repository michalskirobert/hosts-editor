import { ipcMain, app, BrowserWindow, nativeTheme } from "electron";
import fs from "fs";
import path from "path";
import sudo from "sudo-prompt";
import { Settings, SettingsAppearanceMode } from "./types/settings";
import { defaultSettings } from "./utils/settings";

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
      const preferred: SettingsAppearanceMode = nativeTheme.shouldUseDarkColors
        ? "dark"
        : "light";

      const processedDefaultSettings: Settings = {
        ...defaultSettings,
        appearance: {
          ...defaultSettings.appearance,
          preferred,
        },
      };

      if (!fs.existsSync(userSettingsPath)) {
        fs.writeFileSync(
          userSettingsPath,
          JSON.stringify(processedDefaultSettings),
          "utf-8",
        );

        return processedDefaultSettings;
      }

      const res = fs.readFileSync(userSettingsPath, "utf-8");
      return JSON.parse(res);
    } catch (err) {
      return { error: String(err) };
    }
  });

  ipcMain.handle("update-settings", async (_event, data: Settings) => {
    try {
      const preferred: SettingsAppearanceMode = nativeTheme.shouldUseDarkColors
        ? "dark"
        : "light";

      const bodyRequest: Settings = {
        ...data,
        appearance: {
          ...data.appearance,
          preferred,
        },
      };

      fs.writeFileSync(
        userSettingsPath,
        JSON.stringify(bodyRequest, null, 2),
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

  ipcMain.handle("toggle-fullscreen", (_event, value: boolean) => {
    const win = BrowserWindow.getFocusedWindow();

    if (!win) return false;

    win.setFullScreen(value);

    return true;
  });
}
