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

  if (!version) {
    throw new Error("The update server returned an invalid version.");
  }

  return version;
};

export const isNewerVersion = (candidate: string, current: string): boolean => {
  const next = semver.valid(candidate);
  const installed = semver.valid(current);

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
  ) {
    throw new Error("Unexpected release URL.");
  }

  return url.toString();
};

export const validateDownloadUrl = (value: string, redirected = false): string => {
  const url = new URL(value);

  if (url.protocol !== "https:" || url.username || url.password || url.port) {
    throw new Error("Unsafe installer download URL.");
  }

  const official =
    url.hostname === "github.com" &&
    url.pathname.startsWith(`/${source.owner}/${source.repo}/releases/download/`);

  const storage =
    redirected &&
    ["release-assets.githubusercontent.com", "objects.githubusercontent.com"].includes(
      url.hostname,
    );

  if (!official && !storage) {
    throw new Error("The installer redirect is not an official GitHub download.");
  }

  return url.toString();
};

export const expectedAssetNames = (
  version: string,
  platform: string,
  arch: string,
  preferAppImage = false,
): readonly string[] => {
  if (!["darwin", "win32", "linux"].includes(platform) || !["x64", "arm64"].includes(arch)) {
    return [];
  }

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

type Platform = "darwin" | "win32" | "linux";
type Architecture = "arm64" | "x64";
type PackageType = "dmg" | "zip" | "exe" | "deb" | "AppImage";

const platforms = new Map<string, Platform>([
  ["darwin", "darwin"],
  ["mac", "darwin"],
  ["macos", "darwin"],
  ["osx", "darwin"],
  ["win32", "win32"],
  ["win", "win32"],
  ["windows", "win32"],
  ["linux", "linux"],
]);

const architectures = new Map<string, Architecture>([
  ["arm64", "arm64"],
  ["aarch64", "arm64"],
  ["x64", "x64"],
  ["amd64", "x64"],
  ["x86_64", "x64"],
  ["x86-64", "x64"],
]);

const packageTypes = new Map<string, PackageType>([
  ["dmg", "dmg"],
  ["zip", "zip"],
  ["exe", "exe"],
  ["deb", "deb"],
  ["AppImage", "AppImage"],
]);

const packagePlatforms = new Map<PackageType, Platform>([
  ["dmg", "darwin"],
  ["exe", "win32"],
  ["deb", "linux"],
  ["AppImage", "linux"],
]);

const qualifiers = new Set(["setup", "installer", "portable", "unsigned", "signed"]);

interface InstallerName {
  readonly platform: Platform;
  readonly arch: Architecture;
  readonly packageType: PackageType;
  readonly explicitPlatform: boolean;
}

const parseInstallerName = (name: string, version: string): InstallerName | undefined => {
  if (/[/\\\0]/.test(name)) {
    return undefined;
  }

  if (/(?:^|[-_.\s])(?:source|sources|src)(?=$|[-_.\s])/i.test(name)) {
    return undefined;
  }

  const extension = /\.([a-z]+)$/i.exec(name)?.[1];
  const packageType = extension ? packageTypes.get(extension) : undefined;

  if (!packageType) {
    return undefined;
  }

  const stem = name.slice(0, -(extension?.length ?? 0) - 1);
  const escapedVersion = version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const match = new RegExp(`(?:^|[-_\\s])v?${escapedVersion}(?=$|[-_\\s])`, "i").exec(stem);

  if (!match) {
    return undefined;
  }

  const suffix = stem.slice(match.index + match[0].length).replace(/x86[_-]64/gi, "x64");

  const tokens = suffix
    .toLowerCase()
    .split(/[-_.\s]+/)
    .filter(Boolean);

  const foundPlatforms = new Set<Platform>();
  const foundArchitectures = new Set<Architecture>();

  for (const token of tokens) {
    const platform = platforms.get(token);
    const arch = architectures.get(token);

    if (platform) {
      foundPlatforms.add(platform);
    } else if (arch) {
      foundArchitectures.add(arch);
    } else if (!qualifiers.has(token)) {
      return undefined;
    }
  }

  if (foundPlatforms.size > 1 || foundArchitectures.size !== 1) {
    return undefined;
  }

  const explicitPlatform = foundPlatforms.size === 1;
  const statedPlatform = foundPlatforms.values().next().value;
  const inferredPlatform = packagePlatforms.get(packageType);

  if (statedPlatform && inferredPlatform && statedPlatform !== inferredPlatform) {
    return undefined;
  }

  const platform = statedPlatform ?? inferredPlatform;
  const arch = foundArchitectures.values().next().value;

  if (!platform || !arch) {
    return undefined;
  }

  return {
    platform,
    arch,
    packageType,
    explicitPlatform,
  };
};

export const selectReleaseAssetInfo = (
  assets: readonly ReleaseAsset[],
  version: string,
  platform: string,
  arch: string,
  preferAppImage = false,
): ReleaseAsset | undefined => {
  const targetPlatform = platforms.get(platform.trim().toLowerCase());
  const targetArch = architectures.get(arch.trim().toLowerCase());

  if (!targetPlatform || !targetArch) {
    return undefined;
  }

  const releaseVersion = normalizedVersion(version);

  const preferences: readonly PackageType[] =
    targetPlatform === "darwin"
      ? ["dmg", "zip"]
      : targetPlatform === "win32"
        ? ["exe", "zip"]
        : preferAppImage
          ? ["AppImage", "deb"]
          : ["deb", "AppImage"];

  const candidates: {
    readonly asset: ReleaseAsset;
    readonly rank: number;
  }[] = [];

  for (const asset of assets) {
    const parsed = parseInstallerName(asset.name, releaseVersion);

    if (parsed?.platform !== targetPlatform || parsed.arch !== targetArch) {
      continue;
    }

    const priority = preferences.indexOf(parsed.packageType);

    if (priority < 0) {
      continue;
    }

    const url = new URL(validateDownloadUrl(asset.browser_download_url));
    const parts = url.pathname.split("/");

    if (decodeURIComponent(parts.at(-1) ?? "") !== asset.name) {
      continue;
    }

    if (normalizedVersion(decodeURIComponent(parts.at(-2) ?? "")) !== releaseVersion) {
      throw new Error("Installer metadata does not match the release.");
    }

    candidates.push({
      asset,
      rank: priority * 100 + (parsed.explicitPlatform ? 0 : 1),
    });
  }

  candidates.sort(
    (left, right) =>
      left.rank - right.rank || left.asset.name.localeCompare(right.asset.name, "en"),
  );

  return candidates[0]?.asset;
};

export const sha256Digest = (asset: ReleaseAsset): string => {
  if (!asset.digest || !/^sha256:[a-f0-9]{64}$/i.test(asset.digest)) {
    throw new Error(
      "This release has no verifiable installer checksum. Please try again after the release is updated.",
    );
  }

  return asset.digest.slice(7).toLowerCase();
};
