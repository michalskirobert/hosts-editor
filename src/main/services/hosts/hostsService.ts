import { execFile } from "node:child_process";
import fs from "node:fs/promises";
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

    if (process.platform === "darwin") {
      await this.mac(content);
    } else if (process.platform === "win32") {
      await this.windows(content);
    } else {
      await this.linux(content);
    }
  }

  private async mac(content: string): Promise<void> {
    const encodedContent = Buffer.from(content, "utf8").toString("base64");

    const command = [
      `/bin/echo '${encodedContent}' | /usr/bin/base64 -D > /etc/hosts`,
      "/usr/sbin/chown root:wheel /etc/hosts",
      "/bin/chmod 644 /etc/hosts",
      "/usr/bin/dscacheutil -flushcache",
      "/usr/bin/killall -HUP mDNSResponder || true",
    ].join(" && ");

    const escapedCommand = command.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

    const script = `do shell script "${escapedCommand}" with administrator privileges`;

    await exec("/usr/bin/osascript", ["-e", script]);
  }

  private async linux(content: string): Promise<void> {
    const encodedContent = Buffer.from(content, "utf8").toString("base64");

    const command =
      `echo '${encodedContent}' | base64 --decode > /etc/hosts && ` + "chmod 644 /etc/hosts";

    try {
      await exec("pkexec", ["/bin/sh", "-c", command]);
    } catch (error: unknown) {
      throw new Error(`Linux elevation failed. PolicyKit/pkexec is required. ${String(error)}`);
    }
  }

  private async windows(content: string): Promise<void> {
    const encodedContent = Buffer.from(content, "utf16le").toString("base64");
    const escapedHostsPath = this.path().replace(/'/g, "''");

    const writeCommand =
      `$content = [System.Text.Encoding]::Unicode.GetString(` +
      `[System.Convert]::FromBase64String('${encodedContent}')); ` +
      `[System.IO.File]::WriteAllText(` +
      `'${escapedHostsPath}', $content, [System.Text.Encoding]::UTF8)`;

    const encodedCommand = Buffer.from(writeCommand, "utf16le").toString("base64");

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
