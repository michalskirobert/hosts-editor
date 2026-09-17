import { app, shell } from "electron";

import type { UpdateState } from "../../../shared/types";

const releaseApiUrl = "https://api.github.com/repos/michalskirobert/hosts-editor/releases/latest";
const releaseUrl = "https://github.com/michalskirobert/hosts-editor/releases/latest";

interface GitHubRelease {
  readonly tag_name: string;
  readonly html_url: string;
  readonly draft: boolean;
  readonly prerelease: boolean;
}

const normalizeVersion = (value: string): readonly number[] =>
  value
    .trim()
    .replace(/^v/i, "")
    .split(".")
    .map((part) => Number.parseInt(part, 10) || 0);

const isNewerVersion = (candidate: string, current: string): boolean => {
  const next = normalizeVersion(candidate);
  const installed = normalizeVersion(current);
  const length = Math.max(next.length, installed.length);

  for (let index = 0; index < length; index += 1) {
    const nextPart = next[index] ?? 0;
    const installedPart = installed[index] ?? 0;
    if (nextPart > installedPart) return true;
    if (nextPart < installedPart) return false;
  }

  return false;
};

export class UpdateService {
  private availableReleaseUrl = releaseUrl;

  async check(): Promise<UpdateState> {
    try {
      const response = await fetch(releaseApiUrl, {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": `Hosts-Editor/${app.getVersion()}`,
        },
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        throw new Error(`GitHub returned HTTP ${String(response.status)}`);
      }

      const release = (await response.json()) as GitHubRelease;
      const version = release.tag_name.replace(/^v/i, "");
      this.availableReleaseUrl = release.html_url || releaseUrl;

      if (!release.draft && !release.prerelease && isNewerVersion(version, app.getVersion())) {
        return {
          status: "available",
          version,
          releaseUrl: this.availableReleaseUrl,
          message: `Version ${version} is available.`,
        };
      }

      return {
        status: "current",
        version: app.getVersion(),
        message: "Hosts Editor is up to date.",
      };
    } catch {
      return {
        status: "error",
        message:
          "Could not connect to the update server. Try again later or contact rm.software.lab@gmail.com.",
        releaseUrl,
      };
    }
  }

  async open(): Promise<void> {
    await shell.openExternal(this.availableReleaseUrl);
  }
}
