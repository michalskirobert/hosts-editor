import { z } from "zod";

export const releaseUrl = "https://github.com/michalskirobert/hosts-editor/releases/latest";
export const releaseApiUrl =
  "https://api.github.com/repos/michalskirobert/hosts-editor/releases/latest";

export const releaseSchema = z.object({
  tag_name: z.string().regex(/^v?\d+\.\d+\.\d+$/),
  html_url: z.url(),
  draft: z.boolean(),
  prerelease: z.boolean(),
  assets: z.array(z.object({ name: z.string(), browser_download_url: z.url() })),
});

export const isNewerVersion = (candidate: string, current: string): boolean => {
  if (!/^v?\d+\.\d+\.\d+$/.test(candidate)) return false;
  const next = candidate.replace(/^v/, "").split(".").map(Number);
  const installed = current.replace(/^v/, "").split(/[.-]/).slice(0, 3).map(Number);
  for (let index = 0; index < 3; index += 1) {
    if ((next[index] ?? 0) !== (installed[index] ?? 0))
      return (next[index] ?? 0) > (installed[index] ?? 0);
  }
  return false;
};

export const safeReleaseUrl = (value: string): string => {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.hostname !== "github.com" ||
    url.username ||
    url.password ||
    url.port ||
    !url.pathname.startsWith("/michalskirobert/hosts-editor/releases/")
  ) {
    throw new Error("Unexpected update download URL.");
  }
  return url.toString();
};

export const selectReleaseAsset = (
  assets: readonly { readonly name: string; readonly browser_download_url: string }[],
  platform: string,
  arch: string,
): string | undefined => {
  if (!["x64", "arm64"].includes(arch) || !["darwin", "win32", "linux"].includes(platform))
    return undefined;
  const os = platform === "darwin" ? "mac" : platform === "win32" ? "win" : "linux";
  const extensions =
    platform === "darwin"
      ? [".dmg", ".zip"]
      : platform === "win32"
        ? [".exe", ".zip"]
        : [".AppImage", ".deb"];
  const aliases =
    platform === "linux" && arch === "x64"
      ? ["x64", "x86_64", "amd64"]
      : platform === "linux" && arch === "arm64"
        ? ["arm64", "aarch64"]
        : [arch];
  for (const extension of extensions) {
    const asset = assets.find(({ name }) =>
      aliases.some((architecture) => name.endsWith(`-${os}-${architecture}${extension}`)),
    );
    if (asset) return safeReleaseUrl(asset.browser_download_url);
  }
  return undefined;
};
