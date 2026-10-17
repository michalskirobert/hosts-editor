import semver from "semver";
import { z } from "zod";
import source from "../../../shared/config/update-source.json";

export const releaseBase = `https://github.com/${source.owner}/${source.repo}/releases`;
export const releaseUrl = `${releaseBase}/latest`;
export const releaseApiUrl = `https://api.github.com/repos/${source.owner}/${source.repo}/releases/latest`;
export const maxInstallerBytes = 2 * 1024 * 1024 * 1024;
export const assetSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  browser_download_url: z.url(),
  size: z.number().int().positive().max(maxInstallerBytes),
  digest: z.string().nullable().optional(),
  state: z.literal("uploaded").default("uploaded"),
});
export type ReleaseAsset = z.infer<typeof assetSchema>;
export const releaseSchema = z.object({
  tag_name: z.string().refine((value) => semver.valid(value) !== null),
  html_url: z.url(),
  draft: z.boolean(),
  prerelease: z.boolean(),
  assets: z.array(assetSchema),
});

export const normalizedVersion = (value: string): string => {
  const version = semver.valid(value);
  if (!version) throw new Error("The update server returned an invalid version.");
  return version;
};
export const isNewerVersion = (candidate: string, current: string): boolean => {
  const next = semver.valid(candidate),
    installed = semver.valid(current);
  return Boolean(
    next && installed && semver.prerelease(next) === null && semver.gt(next, installed),
  );
};
export const safeReleaseUrl = (value: string): string => {
  const url = new URL(value);
  if (
    url.origin !== "https://github.com" ||
    url.username ||
    url.password ||
    !url.pathname.startsWith(`/${source.owner}/${source.repo}/releases/`)
  )
    throw new Error("Unexpected release URL.");
  return url.toString();
};
export const validateDownloadUrl = (value: string, redirected = false): string => {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.port)
    throw new Error("Unsafe installer download URL.");
  const official =
    url.hostname === "github.com" &&
    url.pathname.startsWith(`/${source.owner}/${source.repo}/releases/download/`);
  const storage =
    redirected &&
    ["release-assets.githubusercontent.com", "objects.githubusercontent.com"].includes(
      url.hostname,
    );
  if (!official && !storage)
    throw new Error("The installer redirect is not an official GitHub download.");
  return url.toString();
};
export const expectedAssetNames = (
  version: string,
  platform: string,
  arch: string,
  preferAppImage = false,
): readonly string[] => {
  if (!["darwin", "win32", "linux"].includes(platform) || !["x64", "arm64"].includes(arch))
    return [];
  const os = platform === "darwin" ? "mac" : platform === "win32" ? "win" : "linux";
  const extensions =
    platform === "darwin"
      ? ["dmg"]
      : platform === "win32"
        ? ["exe", "zip"]
        : preferAppImage
          ? ["AppImage", "deb"]
          : ["deb", "AppImage"];
  const architectures =
    platform === "linux"
      ? arch === "x64"
        ? ["x64", "x86_64", "amd64"]
        : ["arm64", "aarch64"]
      : [arch];
  return extensions.flatMap((extension) =>
    architectures.flatMap((architecture) =>
      [source.productName, source.productName.replace(/ /g, "-")].map(
        (name) => `${name}-${version}-${os}-${architecture}.${extension}`,
      ),
    ),
  );
};
export const selectReleaseAssetInfo = (
  assets: readonly ReleaseAsset[],
  version: string,
  platform: string,
  arch: string,
  preferAppImage = false,
): ReleaseAsset | undefined => {
  for (const name of expectedAssetNames(version, platform, arch, preferAppImage)) {
    const asset = assets.find((item) => item.name === name);
    if (!asset) continue;
    const url = new URL(validateDownloadUrl(asset.browser_download_url));
    const parts = url.pathname.split("/");
    if (
      decodeURIComponent(parts.at(-1) ?? "") !== asset.name ||
      normalizedVersion(decodeURIComponent(parts.at(-2) ?? "")) !== version
    )
      throw new Error("Installer metadata does not match the release.");
    return asset;
  }
  return undefined;
};
export const sha256Digest = (asset: ReleaseAsset): string => {
  if (!asset.digest || !/^sha256:[a-f0-9]{64}$/i.test(asset.digest))
    throw new Error(
      "This release has no verifiable installer checksum. Please try again after the release is updated.",
    );
  return asset.digest.slice(7).toLowerCase();
};
