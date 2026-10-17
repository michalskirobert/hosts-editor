import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile, mkdtemp, readdir, rm } from "node:fs/promises";
import os from "node:os";
import { EventEmitter } from "node:events";
import { createHash } from "node:crypto";
import path from "node:path";
import { build } from "esbuild";

const source = await readFile("src/main/services/update/release.ts", "utf8");

const bundle = await build({
  stdin: {
    contents: source,
    loader: "ts",
    resolveDir: path.resolve("src/main/services/update"),
  },
  write: false,
  bundle: true,
  platform: "node",
  format: "esm",
  banner: {
    js: `import { createRequire } from "node:module"; const require = createRequire(${JSON.stringify(path.resolve("package.json"))});`,
  },
});

const api = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);

const asset = (name, id = 1) => ({
  id,
  name,
  size: 2048,
  state: "uploaded",
  digest: `sha256:${"a".repeat(64)}`,
  browser_download_url:
    "https://github.com/michalskirobert/hosts-editor/releases/download/v2.3.2/" +
    encodeURIComponent(name),
});

const publishedNames = [
  "Hosts-Editor-2.3.2-mac-arm64.dmg",
  "Hosts-Editor-2.3.2-mac-arm64.zip",
  "Hosts-Editor-2.3.2-mac-x64.dmg",
  "Hosts-Editor-2.3.2-mac-x64.zip",
  "latest-mac.yml",
];

const select = (names, platform = "darwin", arch = "arm64", version = "2.3.2") =>
  api.selectReleaseAssetInfo(
    names.map((name, index) => asset(name, index + 1)),
    version,
    platform,
    arch,
  );

test("exact published release chooses the macOS ARM64 DMG", () => {
  assert.equal(select(publishedNames)?.name, "Hosts-Editor-2.3.2-mac-arm64.dmg");
});

test("exact published release chooses the macOS Intel DMG", () => {
  assert.equal(select(publishedNames, "darwin", "x64")?.name, "Hosts-Editor-2.3.2-mac-x64.dmg");
});

test("product prefix is independent of configured productName", () => {
  for (const prefix of ["Product", "Different-App", "NurByte Tool"]) {
    const name = `${prefix}-2.3.2-mac-arm64.dmg`;
    assert.equal(select([name])?.name, name);
  }
});

test("macOS supports missing OS, mac and darwin naming variants", () => {
  for (const name of [
    "Product-2.3.2-arm64.dmg",
    "Product-2.3.2-mac-arm64.dmg",
    "Product-2.3.2-darwin-arm64.dmg",
    "Product_2.3.2_macos_aarch64.dmg",
    "Product-v2.3.2-arm64-darwin.dmg",
  ]) {
    assert.equal(select([name])?.name, name);
  }
});

test("platform and architecture aliases normalize without CPU guessing", () => {
  assert.equal(select(publishedNames, "macOS", "aarch64")?.name, publishedNames[0]);
  assert.equal(select(publishedNames, "darwin", "x86_64")?.name, publishedNames[2]);
});

test("DMG is preferred regardless of asset ordering and ZIP remains a fallback", () => {
  assert.equal(select([...publishedNames].reverse())?.name, publishedNames[0]);
  assert.equal(select([publishedNames[1]])?.name, publishedNames[1]);
});

test("blockmaps, source archives and metadata are never installers", () => {
  for (const name of [
    "Hosts-Editor-2.3.2-mac-arm64.dmg.blockmap",
    "Hosts-Editor-2.3.2-mac-arm64.zip.blockmap",
    "Hosts-Editor-2.3.2-mac-arm64.blockmap",
    "Hosts-Editor-2.3.2-mac-arm64-source.zip",
    "source-2.3.2-mac-arm64.zip",
    "v2.3.2.zip",
    "latest-mac.yml",
  ]) {
    assert.equal(select([name]), undefined, name);
  }
});

test("wrong architecture, contradictory OS and ambiguous names are rejected", () => {
  for (const name of [
    "Product-2.3.2-mac-x64.dmg",
    "Product-2.3.2-windows-arm64.dmg",
    "Product-2.3.2-linux-arm64.dmg",
    "Product-2.3.2-mac-arm64-x64.dmg",
    "Product-2.3.2-mac-arm64-linux.dmg",
    "Product-2.3.2-mac.dmg",
    "Product-2.3.2-arm64.zip",
    "Product-2.3.2-mac-arm64-debug.dmg",
  ]) {
    assert.equal(select([name]), undefined, name);
  }

  assert.equal(select(publishedNames, "darwin", "ia32"), undefined);
});

test("version matching rejects partial, old and prerelease filenames", () => {
  for (const version of ["2.3.1", "2.3.20", "12.3.2", "2.3.2-rc.1"]) {
    assert.equal(select([`Product-${version}-mac-arm64.dmg`]), undefined);
  }

  assert.equal(select(publishedNames, "darwin", "arm64", "v2.3.2")?.name, publishedNames[0]);
});

test("Windows and Linux matching remain platform specific on both architectures", () => {
  for (const arch of ["arm64", "x64"]) {
    for (const [platform, os, extension] of [
      ["win32", "windows", "exe"],
      ["linux", "linux", "deb"],
      ["linux", "linux", "AppImage"],
    ]) {
      const name = `Different-App-2.3.2-${os}-${arch}.${extension}`;
      assert.equal(select([name], platform, arch)?.name, name);
    }
  }

  assert.equal(
    select(["Product-2.3.2-linux-x86_64.AppImage"], "linux", "x64")?.name,
    "Product-2.3.2-linux-x86_64.AppImage",
  );
});

test("AppImage installations prefer AppImage over DEB", () => {
  const assets = [
    asset("Product-2.3.2-linux-arm64.deb", 1),
    asset("Product-2.3.2-linux-arm64.AppImage", 2),
  ];

  assert.equal(
    api.selectReleaseAssetInfo(assets, "2.3.2", "linux", "arm64", true)?.name,
    assets[1].name,
  );
});

test("download URL must identify the selected filename and release", () => {
  const selected = asset(publishedNames[0]);

  assert.equal(
    api.selectReleaseAssetInfo(
      [{ ...selected, name: "Different-App-2.3.2-mac-arm64.dmg" }],
      "2.3.2",
      "darwin",
      "arm64",
    ),
    undefined,
  );

  assert.throws(() =>
    api.selectReleaseAssetInfo(
      [
        {
          ...selected,
          browser_download_url: selected.browser_download_url.replace("/v2.3.2/", "/v2.3.3/"),
        },
      ],
      "2.3.2",
      "darwin",
      "arm64",
    ),
  );

  assert.throws(() =>
    api.selectReleaseAssetInfo(
      [
        {
          ...selected,
          browser_download_url: selected.browser_download_url.replace("github.com", "evil.example"),
        },
      ],
      "2.3.2",
      "darwin",
      "arm64",
    ),
  );
});

test("builder configuration keeps architecture and extension in artifact names", async () => {
  const { default: yaml } = await import("js-yaml");
  const config = yaml.load(await readFile("electron-builder.yml", "utf8"));

  const effective = [
    config.artifactName,
    config.mac?.artifactName,
    config.dmg?.artifactName,
    config.zip?.artifactName,
  ].filter(Boolean);

  for (const pattern of effective) {
    assert.ok(pattern.includes("${version}"), pattern);
    assert.ok(pattern.includes("${arch}"), pattern);
    assert.ok(pattern.endsWith(".${ext}"), pattern);
  }

  assert.equal(config.mac.identity, null);
});

test("macOS ARM64 service detects, downloads, verifies and opens the exact published DMG", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "hosts-selection-"));
  const originalFetch = globalThis.fetch;
  const originalPlatform = Object.getOwnPropertyDescriptor(process, "platform");
  const originalArch = Object.getOwnPropertyDescriptor(process, "arch");

  const events = [];
  const requested = [];
  let opened;

  const bytes = Buffer.alloc(2048, 7);
  bytes.write("koly", bytes.length - 512);

  const checksum = createHash("sha256").update(bytes).digest("hex");

  globalThis.hostsEditorSelectionTest = {
    app: {
      isPackaged: false,
      getVersion: () => "2.3.1",
      getPath: () => directory,
    },
    BrowserWindow: {
      getAllWindows: () => [
        {
          isDestroyed: () => false,
          webContents: {
            send: (_channel, state) => events.push(state),
          },
        },
      ],
    },
    shell: {
      openPath: async (file) => {
        opened = file;
        return "";
      },
      showItemInFolder: () => undefined,
    },
    updater: new EventEmitter(),
    execFile: (_file, _args, callback) => callback(null, "", ""),
  };

  try {
    Object.defineProperty(process, "platform", { value: "darwin" });
    Object.defineProperty(process, "arch", { value: "arm64" });

    const result = await build({
      stdin: {
        contents: 'export { UpdateService } from "./updateService.ts";',
        resolveDir: path.resolve("src/main/services/update"),
      },
      write: false,
      bundle: true,
      platform: "node",
      format: "esm",
      banner: {
        js: `import { createRequire } from "node:module"; const require = createRequire(${JSON.stringify(path.resolve("package.json"))});`,
      },
      plugins: [
        {
          name: "update-selection-adapters",
          setup(builder) {
            builder.onLoad({ filter: /release\.ts$/ }, () => ({
              contents: source,
              loader: "ts",
              resolveDir: path.resolve("src/main/services/update"),
            }));

            builder.onResolve(
              { filter: /^(electron|electron-updater|node:child_process)$/ },
              (args) => ({
                path: args.path,
                namespace: "selection-fixture",
              }),
            );

            builder.onLoad({ filter: /.*/, namespace: "selection-fixture" }, ({ path: name }) => ({
              contents:
                name === "electron"
                  ? "export const { app, BrowserWindow, shell } = globalThis.hostsEditorSelectionTest;"
                  : name === "electron-updater"
                    ? "export default { autoUpdater: globalThis.hostsEditorSelectionTest.updater };"
                    : "export const execFile = globalThis.hostsEditorSelectionTest.execFile;",
              loader: "js",
            }));
          },
        },
      ],
    });

    const serviceApi = await import(
      `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
    );

    globalThis.fetch = async (url) => {
      requested.push(String(url));

      if (String(url).includes("api.github.com")) {
        return new Response(
          JSON.stringify({
            tag_name: "v2.3.2",
            html_url: "https://github.com/michalskirobert/hosts-editor/releases/tag/v2.3.2",
            draft: false,
            prerelease: false,
            assets: publishedNames.map((name, index) => ({
              ...asset(name, index + 1),
              digest: `sha256:${checksum}`,
            })),
          }),
        );
      }

      let position = 0;

      return new Response(
        new ReadableStream({
          async pull(controller) {
            await new Promise((resolve) => setTimeout(resolve, 30));

            if (position === bytes.length) {
              controller.close();
              return;
            }

            controller.enqueue(bytes.subarray(position, position + 256));
            position += 256;
          },
        }),
      );
    };

    const service = new serviceApi.UpdateService();
    const available = await service.check();

    assert.equal(available.status, "available");
    assert.equal(available.currentVersion, "2.3.1");
    assert.equal(available.version, "2.3.2");
    assert.equal(available.installSupported, false);

    assert.equal((await service.download()).status, "downloaded");

    assert.ok(requested[1].endsWith("/Hosts-Editor-2.3.2-mac-arm64.dmg"));

    assert.ok(events.some((event) => event.progress?.percent > 0 && event.progress.percent < 100));

    assert.ok(events.some((event) => event.progress?.transferred === bytes.length));

    await service.open();

    assert.ok(opened.endsWith("-Hosts-Editor-2.3.2-mac-arm64.dmg"));

    assert.equal((await readdir(path.join(directory, "updates", "installers"))).length, 1);
  } finally {
    globalThis.fetch = originalFetch;

    Object.defineProperty(process, "platform", originalPlatform);
    Object.defineProperty(process, "arch", originalArch);

    delete globalThis.hostsEditorSelectionTest;

    await rm(directory, { recursive: true, force: true });
  }
});
