import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import { getHostLineError, serializeLines } from "../../../shared/domain/hosts";
import type { HostTab } from "../../../shared/types";

const exec = promisify(execFile);

export class HostsService {
  private applying = false;

  path(): string {
    return process.platform === "win32"
      ? path.join(process.env.SystemRoot ?? "C:\\Windows", "System32", "drivers", "etc", "hosts")
      : "/etc/hosts";
  }

  async read(): Promise<string> {
    return fs.readFile(this.path(), "utf8");
  }

  render(tabs: readonly HostTab[]): string {
    const enabledTabs = tabs.filter((tab) => tab.enabled);
    const invalid = enabledTabs.flatMap((tab) => tab.lines).find((line) => getHostLineError(line));
    if (invalid) throw new Error(getHostLineError(invalid) ?? "Invalid hosts entry.");
    const content = enabledTabs
      .map((tab) => serializeLines(tab.lines))
      .filter(Boolean)
      .join("\n");
    if (!content.trim())
      throw new Error("Refusing to replace the system hosts file with empty content.");
    return content.endsWith("\n") ? content : `${content}\n`;
  }

  async apply(tabs: readonly HostTab[]): Promise<void> {
    if (this.applying) throw new Error("A system hosts save is already in progress.");
    const content = this.render(tabs);
    this.applying = true;
    try {
      if (process.platform === "darwin") await this.mac(content);
      else if (process.platform === "win32") await this.windows(content);
      else await this.linux(content);
    } finally {
      this.applying = false;
    }
  }

  private unixCommand(content: string, mac: boolean): string {
    const encoded = Buffer.from(content, "utf8").toString("base64");
    const directory = mac ? "/private/etc" : "/etc";
    return [
      "set -eu",
      `stage=$(mktemp ${directory}/.hosts-editor.XXXXXX)`,
      `trap 'rm -f "$stage"' EXIT`,
      `printf '%s' '${encoded}' | ${mac ? "/usr/bin/base64 -D" : "base64 --decode"} > "$stage"`,
      'test -s "$stage"',
      'chmod 644 "$stage"',
      `chown ${mac ? "root:wheel" : "root:root"} "$stage"`,
      "if [ -e /etc/hosts ]; then cp -p /etc/hosts /etc/hosts.hosts-editor.backup; fi",
      'mv -f "$stage" /etc/hosts',
      ...(mac
        ? [
            "/usr/bin/dscacheutil -flushcache || true",
            "/usr/bin/killall -HUP mDNSResponder || true",
          ]
        : []),
    ].join("; ");
  }

  private async mac(content: string): Promise<void> {
    const escaped = this.unixCommand(content, true).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    await exec("/usr/bin/osascript", [
      "-e",
      `do shell script "${escaped}" with administrator privileges`,
    ]);
  }

  private async linux(content: string): Promise<void> {
    try {
      await exec("pkexec", ["/bin/sh", "-c", this.unixCommand(content, false)]);
    } catch (error: unknown) {
      throw new Error(`Linux elevation failed. PolicyKit/pkexec is required. ${String(error)}`);
    }
  }

  private async windows(content: string): Promise<void> {
    const encoded = Buffer.from(content, "utf8").toString("base64");
    const hostsPath = this.path().replace(/'/g, "''");
    const script = [
      "$ErrorActionPreference = 'Stop'",
      `$target = '${hostsPath}'`,
      "$stage = $target + '.' + [Guid]::NewGuid().ToString('N') + '.tmp'",
      `try { [IO.File]::WriteAllBytes($stage, [Convert]::FromBase64String('${encoded}'));`,
      "if ((Get-Item -LiteralPath $stage).Length -eq 0) { throw 'Refusing an empty hosts file' };",
      "if ([IO.File]::Exists($target)) { [IO.File]::Replace($stage, $target, $target + '.hosts-editor.backup', $true) } else { [IO.File]::Move($stage, $target) }",
      "} catch { [Console]::Error.WriteLine($_); exit 1 } finally { if ([IO.File]::Exists($stage)) { [IO.File]::Delete($stage) } }",
    ].join("\n");
    const command = Buffer.from(script, "utf16le").toString("base64");
    const elevate = `$ErrorActionPreference = 'Stop'; $p = Start-Process powershell.exe -Verb RunAs -Wait -PassThru -ArgumentList '-NoProfile','-NonInteractive','-EncodedCommand','${command}'; if ($p.ExitCode -ne 0) { throw 'Elevated hosts write failed' }`;
    await exec("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", elevate]);
  }
}
