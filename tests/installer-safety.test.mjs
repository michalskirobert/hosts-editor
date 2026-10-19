import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { build } from "esbuild";

const output = await build({
  stdin: {
    contents:
      'export {InstallerRegistry} from "./src/main/services/update/installerRegistry.ts"; export {InstallerDownload} from "./src/main/services/update/installerDownload.ts";',
    resolveDir: process.cwd(),
  },
  platform: "node",
  format: "esm",
  bundle: true,
  write: false,
  banner: {
    js:
      "import {createRequire} from 'node:module';const require=createRequire(" +
      JSON.stringify(path.join(process.cwd(), "package.json")) +
      ");",
  },
});
const { InstallerRegistry, InstallerDownload } = await import(
  "data:text/javascript;base64," + Buffer.from(output.outputFiles[0].text).toString("base64")
);

const fixture = async (run) => {
  const sandbox = await fs.mkdtemp(path.join(os.tmpdir(), "hosts-editor-safety-"));
  try {
    const root = path.join(sandbox, "userData/updates/installers");
    const app = path.join(sandbox, "Applications/Hosts Editor.app");
    await fs.mkdir(root, { recursive: true });
    await fs.mkdir(app, { recursive: true });
    await fs.writeFile(path.join(app, "sentinel"), "installed application");
    const bytes = Buffer.alloc(2048);
    bytes.write("koly", bytes.length - 512);
    const asset = {
      id: 101,
      name: "Hosts-Editor-2.3.3-mac-arm64.dmg",
      size: bytes.length,
      digest: "sha256:" + createHash("sha256").update(bytes).digest("hex"),
      browser_download_url:
        "https://github.com/michalskirobert/hosts-editor/releases/download/v2.3.3/Hosts-Editor-2.3.3-mac-arm64.dmg",
    };
    const registry = new InstallerRegistry(root);
    await registry.init();
    await registry.track(asset, true);
    const installer = path.join(root, "101-" + asset.name);
    await fs.writeFile(installer, bytes);
    await run({ sandbox, root, app, bytes, asset, registry, installer });
    assert.equal(await fs.readFile(path.join(app, "sentinel"), "utf8"), "installed application");
  } finally {
    await fs.rm(sandbox, { recursive: true, force: true });
  }
};

test("cleanup preserves the isolated installed app and a future installer", async () => {
  await fixture(async ({ registry, installer, bytes }) => {
    await registry.cleanup("2.3.2");
    assert.deepEqual(await fs.readFile(installer), bytes);
    await registry.cleanup("2.3.3");
    await assert.rejects(fs.access(installer), { code: "ENOENT" });
  });
});

test("application bundle paths cannot become tracked installer destinations", async () => {
  await fixture(async ({ registry, asset }) => {
    for (const name of [
      "/Applications/Hosts Editor.app",
      "../../Applications/Hosts Editor.app",
      "Hosts Editor.app",
    ])
      await assert.rejects(registry.track({ ...asset, name }));
  });
});

test("cleanup preserves directories and refuses a tracked symlink to an application", async () => {
  await fixture(async ({ registry, root, installer, app }) => {
    const directory = path.join(root, "Hosts Editor.app");
    await fs.mkdir(directory);
    await fs.unlink(installer);
    await fs.symlink(path.join(app, "sentinel"), installer);
    await registry.cleanup("2.3.3");
    assert.equal((await fs.lstat(directory)).isDirectory(), true);
    assert.equal((await fs.lstat(installer)).isSymbolicLink(), true);
  });
});

test("cache validation refuses a replaced update root and preserves outside files", async () => {
  await fixture(async ({ sandbox, root, asset }) => {
    const downloader = new InstallerDownload(root, "linux");
    await downloader.init("2.3.2");
    const outside = path.join(sandbox, "unrelated");
    await fs.mkdir(outside);
    await fs.rename(root, root + "-original");
    await fs.symlink(outside, root);
    const sentinel = path.join(outside, "101-" + asset.name);
    await fs.writeFile(sentinel, "unrelated file");
    await assert.rejects(downloader.cached(asset), /directory/);
    assert.equal(await fs.readFile(sentinel, "utf8"), "unrelated file");
  });
});

test("index writes refuse a replaced update root", async () => {
  await fixture(async ({ sandbox, root, registry, asset }) => {
    const outside = path.join(sandbox, "unrelated");
    await fs.mkdir(outside);
    await fs.rename(root, root + "-original");
    await fs.symlink(outside, root);
    await assert.rejects(registry.track(asset), /directory/);
    assert.deepEqual(await fs.readdir(outside), []);
  });
});
