import { ipcMain, app, BrowserWindow, nativeTheme } from "electron";
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
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
    const content = lines.join("\n");

    if (process.platform === "darwin") {
      return new Promise((resolve, reject) => {
        const encodedContent = Buffer.from(content, "utf-8").toString("base64");

        const shellCommand = `printf '%s' '${encodedContent}' | /usr/bin/base64 -D > /etc/hosts`;

        const escapedCommand = shellCommand
          .replace(/\\/g, "\\\\")
          .replace(/"/g, '\\"');

        const script = `do shell script "${escapedCommand}" with administrator privileges`;

        execFile("/usr/bin/osascript", ["-e", script], (err) => {
          if (err) {
            reject(err);
            return;
          }

          resolve(true);
        });
      });
    }

    return new Promise((resolve, reject) => {
      const command =
        process.platform === "win32"
          ? `echo "${content}" > C:\\Windows\\System32\\drivers\\etc\\hosts`
          : `printf '%s' "${content}" | sudo tee /etc/hosts > /dev/null`;

      execFile("/bin/sh", ["-c", command], (err) => {
        if (err) {
          reject(err);
          return;
        }

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
