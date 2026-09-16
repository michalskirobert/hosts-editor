import { app } from "electron";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { serializeLines } from "../../../shared/domain/hosts";
import type { HostTab } from "../../../shared/types";

const exec = promisify(execFile);

export class HostsService {
  path(): string {
    return process.platform === "win32"
      ? path.join(process.env.SystemRoot ?? "C:\\Windows", "System32", "drivers", "etc", "hosts")
      : "/etc/hosts";
  }

  async read(): Promise<string> {
    return fs.readFile(this.path(), "utf8");
  }

  render(tabs: readonly HostTab[]): string {
    return `${tabs
      .filter((tab) => tab.enabled)
      .map((tab) => serializeLines(tab.lines))
      .filter(Boolean)
      .join("\n")}\n`;
  }

  async apply(tabs: readonly HostTab[]): Promise<void> {
    const content = this.render(tabs);

    if (!content.trim()) {
      throw new Error("Refusing to replace the system hosts file with empty content.");
    }

    await this.systemBackup();

    const temp = path.join(
      os.tmpdir(),
      `hosts-editor-${String(process.pid)}-${String(Date.now())}`,
    );
    await fs.writeFile(temp, content, {
      encoding: "utf8",
      mode: 0o644,
    });

    try {
      if (process.platform === "darwin") {
        await this.mac(temp);
      } else if (process.platform === "win32") {
        await this.windows(temp);
      } else {
        await this.linux(temp);
      }
    } finally {
      await fs.rm(temp, { force: true }).catch(() => undefined);
    }
  }

  private async systemBackup(): Promise<void> {
    const dir = path.join(app.getPath("userData"), "v2", "system-backups");

    await fs.mkdir(dir, { recursive: true });

    const current = await fs.readFile(this.path());
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    await fs.writeFile(path.join(dir, `hosts-${timestamp}`), current);
  }

  private async mac(temp: string): Promise<void> {
    const escapeForAppleScript = (value: string): string =>
      value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

    const command = [
      `/bin/cp "${escapeForAppleScript(temp)}" /etc/hosts`,
      "/usr/sbin/chown root:wheel /etc/hosts",
      "/bin/chmod 644 /etc/hosts",
    ].join(" && ");

    const script =
      `do shell script "${escapeForAppleScript(command)}" ` + "with administrator privileges";

    await exec("/usr/bin/osascript", ["-e", script]);
  }

  private async linux(temp: string): Promise<void> {
    try {
      await exec("pkexec", ["/bin/cp", temp, "/etc/hosts"]);

      await exec("pkexec", ["/bin/chmod", "644", "/etc/hosts"]);
    } catch (error: unknown) {
      throw new Error(`Linux elevation failed. PolicyKit/pkexec is required. ${String(error)}`);
    }
  }

  private async windows(temp: string): Promise<void> {
    const escapedTemp = temp.replace(/'/g, "''");
    const escapedHostsPath = this.path().replace(/'/g, "''");

    const copyCommand =
      `Copy-Item -LiteralPath '${escapedTemp}' ` + `-Destination '${escapedHostsPath}' -Force`;

    const encodedCommand = Buffer.from(copyCommand, "utf16le").toString("base64");

    const elevationCommand = [
      "Start-Process",
      "powershell.exe",
      "-Verb RunAs",
      "-Wait",
      `-ArgumentList '-NoProfile','-NonInteractive','-EncodedCommand','${encodedCommand}'`,
    ].join(" ");

    await exec("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", elevationCommand]);
  }
}
