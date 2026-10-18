import assert from "node:assert/strict";
import { after, beforeEach, mock, test } from "node:test";
import { EventEmitter } from "node:events";
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const root = await fs.mkdtemp(path.join(os.tmpdir(), "hosts-editor-update-"));
const updater = new EventEmitter();
const platformDescriptor = Object.getOwnPropertyDescriptor(process, "platform");
const originalFetch = globalThis.fetch;
const originalImage = process.env.APPIMAGE;
let state;
const env = {
  app: {
    isPackaged: false,
    getVersion: () => state.runningVersion ?? "2.3.1",
    quit: () => {
      state.quits = (state.quits ?? 0) + 1;
    },
    getPath: (name) =>
      name === "exe" ? path.join(state.directory, "Hosts Editor.exe") : state.directory,
  },
  BrowserWindow: {
    getAllWindows: () => [
      {
        isDestroyed: () => false,
        webContents: {
          send: (_channel, value) => {
            state.events.push(value);
          },
        },
      },
    ],
  },
  shell: {
    openPath: async (file) => {
      state.opened = file;
      return state.openError;
    },
    showItemInFolder: (file) => {
      state.shown = file;
    },
  },
  updater,
  execFile: (file, args, callback) => {
    state.commands.push({ file, args });
    callback(null, "", "");
  },
};
globalThis.updateTest = env;
const file = path.join(root, "bundle.mjs");
await build({
  stdin: {
    contents:
      'export { UpdateService } from "./src/main/services/update/updateService.ts"; export { InstallerDownload } from "./src/main/services/update/installerDownload.ts"; export * from "./src/main/services/update/release.ts";',
    resolveDir: process.cwd(),
  },
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: file,
  banner: {
    js: `import { createRequire } from 'node:module'; const require = createRequire(${JSON.stringify(path.join(process.cwd(), "package.json"))});`,
  },
  plugins: [
    {
      name: "test-adapters",
      setup(builder) {
        builder.onResolve(
          { filter: /^(electron|electron-updater|node:child_process)$/ },
          (args) => ({ path: args.path, namespace: "fixture" }),
        );
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path: name }) => ({
          contents:
            name === "electron"
              ? "export const {app,BrowserWindow,shell}=globalThis.updateTest;"
              : name === "electron-updater"
                ? "export default {autoUpdater:globalThis.updateTest.updater};"
                : "export const execFile=globalThis.updateTest.execFile;",
          loader: "js",
        }));
      },
    },
  ],
});
const api = await import(pathToFileURL(file).href);
const digest = (bytes) => `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
const dmg = () => {
  const bytes = Buffer.alloc(2048, 7);
  bytes.write("koly", bytes.length - 512);
  return bytes;
};
const asset = (bytes = dmg(), name = "Hosts-Editor-2.3.2-mac-arm64.dmg") => ({
  id: 101,
  name,
  size: bytes.length,
  digest: digest(bytes),
  browser_download_url: `https://github.com/michalskirobert/hosts-editor/releases/download/v2.3.2/${encodeURIComponent(name)}`,
  state: "uploaded",
});
const release = (assets = [asset()]) => ({
  tag_name: "v2.3.2",
  html_url: "https://github.com/michalskirobert/hosts-editor/releases/tag/v2.3.2",
  draft: false,
  prerelease: false,
  assets,
});
const platform = (name) => {
  Object.defineProperty(process, "platform", { value: name });
};
const streamed = (bytes, signal, { delay = 0, interrupt = false } = {}) => {
  let timer,
    position = 0,
    finished = false;
  const body = new ReadableStream({
    start(controller) {
      const stop = () => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        controller.error(new DOMException("Aborted", "AbortError"));
      };
      signal?.addEventListener("abort", stop, { once: true });
      const next = () => {
        if (finished) return;
        if (interrupt && position > 0) {
          finished = true;
          controller.error(new Error("Network connection interrupted"));
          return;
        }
        if (position >= bytes.length) {
          finished = true;
          controller.close();
          return;
        }
        controller.enqueue(bytes.subarray(position, position + 256));
        position += 256;
        timer = setTimeout(next, delay);
      };
      timer = setTimeout(next, delay);
    },
    cancel() {
      finished = true;
      clearTimeout(timer);
    },
  });
  return new Response(body);
};
const network = (info, bytes = dmg(), options = {}) => {
  globalThis.fetch = async (url, request = {}) => {
    state.requests.push(String(url));
    return String(url).includes("api.github.com")
      ? new Response(JSON.stringify(info))
      : streamed(bytes, request.signal, options);
  };
};
const serviceFor = async (target = "darwin", bytes = dmg()) => {
  platform(target);
  const architecture = process.arch;
  const extension = target === "darwin" ? "dmg" : target === "win32" ? "exe" : "deb";
  const osName = target === "darwin" ? "mac" : target === "win32" ? "win" : "linux";
  const selected = asset(bytes, `Hosts-Editor-2.3.2-${osName}-${architecture}.${extension}`);
  network(release([selected]), bytes);
  const service = new api.UpdateService();
  assert.equal((await service.check()).status, "available");
  return { service, selected };
};
beforeEach(async () => {
  platform(platformDescriptor.value);
  delete process.env.APPIMAGE;
  updater.removeAllListeners();
  env.app.isPackaged = false;
  state = {
    directory: path.join(root, randomUUID()),
    events: [],
    requests: [],
    commands: [],
    openError: "",
  };
  await fs.mkdir(state.directory);
  updater.checkForUpdates = async () => ({
    updateInfo: { version: "2.3.2" },
    cancellationToken: { cancel: () => undefined },
  });
  updater.downloadUpdate = async () => {
    updater.emit("download-progress", { percent: 42, transferred: 42, total: 100 });
    updater.emit("update-downloaded", { version: "2.3.2" });
    return [];
  };
  updater.quitAndInstall = () => {
    state.installed = true;
  };
});
after(async () => {
  platform(platformDescriptor.value);
  globalThis.fetch = originalFetch;
  if (originalImage === undefined) delete process.env.APPIMAGE;
  else process.env.APPIMAGE = originalImage;
  delete globalThis.updateTest;
  await fs.rm(root, { recursive: true, force: true });
});

test("SemVer handles numeric precedence, build metadata and prerelease exclusion", () => {
  assert.equal(api.isNewerVersion("v2.10.0", "2.9.9"), true);
  assert.equal(api.isNewerVersion("2.3.1+build.2", "2.3.1+build.1"), false);
  assert.equal(api.isNewerVersion("2.3.2-beta.1", "2.3.1"), false);
  assert.equal(api.isNewerVersion("2.3.1", "2.3.1-beta.1"), true);
  assert.throws(() => api.normalizedVersion("2.3.bad"));
});
test("asset selection is exact across all six supported targets and rejects wrong versions", () => {
  for (const target of ["darwin", "win32", "linux"])
    for (const arch of ["x64", "arm64"]) {
      const name = api.expectedAssetNames("2.3.2", target, arch)[0];
      const selected = asset(dmg(), name);
      assert.equal(api.selectReleaseAssetInfo([selected], "2.3.2", target, arch).name, name);
      assert.equal(api.selectReleaseAssetInfo([selected], "2.3.3", target, arch), undefined);
      assert.equal(
        api.selectReleaseAssetInfo(
          [{ ...selected, name: `prefix-${name}` }],
          "2.3.2",
          target,
          arch,
        ),
        undefined,
      );
    }
  assert.equal(api.selectReleaseAssetInfo([asset()], "2.3.2", "darwin", "x64"), undefined);
  assert.throws(() =>
    api.selectReleaseAssetInfo(
      [
        {
          ...asset(),
          browser_download_url: asset().browser_download_url.replace("v2.3.2", "v2.3.3"),
        },
      ],
      "2.3.2",
      "darwin",
      "arm64",
    ),
  );
});
test("only official HTTPS URLs and exact GitHub asset redirect hosts are accepted", () => {
  for (const url of [
    "http://github.com/michalskirobert/hosts-editor/releases/download/v2.3.2/test.dmg",
    "https://evil.example/test.dmg",
    "https://user@github.com/michalskirobert/hosts-editor/releases/download/v2.3.2/test.dmg",
    "https://github.com/attacker/repo/releases/download/v2.3.2/test.dmg",
    "https://release-assets.githubusercontent.com.evil.example/x",
  ])
    assert.throws(() => api.validateDownloadUrl(url, true));
  assert.throws(() => api.validateDownloadUrl("https://release-assets.githubusercontent.com/x"));
  assert.equal(
    api.validateDownloadUrl("https://release-assets.githubusercontent.com/x", true),
    "https://release-assets.githubusercontent.com/x",
  );
});
test("current release has no signing warnings or installer actions", async () => {
  platform("darwin");
  network({ ...release(), tag_name: "v2.3.1", assets: [] });
  const result = await new api.UpdateService().check();
  assert.equal(result.status, "current");
  assert.equal(result.message, "Hosts Editor is up to date.");
  assert.equal(result.installSupported, undefined);
  assert.equal(result.limitation, undefined);
});
test("drafts and prereleases are ignored; malformed metadata and missing packages fail clearly", async () => {
  platform("darwin");
  for (const info of [
    { ...release(), draft: true },
    { ...release(), prerelease: true },
  ]) {
    network(info);
    assert.equal((await new api.UpdateService().check()).status, "current");
  }
  for (const info of [{}, { ...release(), tag_name: "invalid" }, release([])]) {
    network(info);
    const result = await new api.UpdateService().check();
    assert.equal(result.status, "error");
    assert.ok(result.message.length > 10);
  }
});
test("parallel and immediate repeated checks make a single network request", async () => {
  const { service } = await serviceFor();
  await Promise.all([service.check(), service.check(), service.check()]);
  assert.equal(state.requests.length, 1);
});
test("offline and rate limits produce readable errors and respect server retry cooldown", async () => {
  globalThis.fetch = async () => {
    throw new TypeError("fetch failed");
  };
  assert.match((await new api.UpdateService().check()).message, /connection/i);
  let requests = 0;
  globalThis.fetch = async () => {
    requests++;
    return new Response("limited", { status: 429, headers: { "retry-after": "120" } });
  };
  const service = new api.UpdateService();
  assert.equal((await service.check()).status, "error");
  await service.check();
  assert.equal(requests, 1);
});
test("direct DMG download writes real chunks, verifies checksum and records actual progress", async () => {
  const { service, selected } = await serviceFor();
  network(release([selected]), dmg(), { delay: 20 });
  assert.equal((await service.download()).status, "downloaded");
  const progress = state.events.filter((item) => item.progress).map((item) => item.progress);
  assert.ok(progress.some((item) => item.percent > 0 && item.percent < 100));
  assert.equal(progress.at(-1).transferred, dmg().length);
  assert.equal(progress.at(-1).percent, 100);
  const names = await fs.readdir(path.join(state.directory, "updates/installers"));
  assert.equal(names.length, 1);
  assert.ok(names[0].endsWith(".dmg"));
  assert.equal(
    names.some((name) => name.endsWith(".part")),
    false,
  );
  assert.ok(
    state.commands.every(
      (item) => item.args[0] === "-w" && item.args[1] === "com.apple.quarantine",
    ),
  );
  assert.equal(state.installed, undefined);
});
test("Open Installer and Show in Folder operate only on a reverified service-owned file", async () => {
  const { service } = await serviceFor();
  await assert.rejects(service.open());
  await service.download();
  await service.open();
  await service.showInFolder();
  assert.equal(state.opened, state.shown);
  await fs.writeFile(state.opened, "tampered");
  await assert.rejects(service.open(), /size|checksum/);
  assert.equal(service.getState().status, "error");
});
test("OS opening errors explain the failed action without bypassing security", async () => {
  const { service } = await serviceFor();
  await service.download();
  state.openError = "OS rejected";
  await assert.rejects(service.open(), /macOS could not open/);
});
test("download deduplication and cache reuse avoid downloading a verified package twice", async () => {
  const { service } = await serviceFor();
  await Promise.all([service.download(), service.download(), service.download()]);
  assert.equal(state.requests.filter((url) => !url.includes("api.github.com")).length, 1);
  const restarted = new api.UpdateService();
  assert.equal((await restarted.check()).status, "downloaded");
  assert.equal(state.requests.filter((url) => !url.includes("api.github.com")).length, 1);
});
test("download cancellation aborts the real stream, cleans partial files and permits retry", async () => {
  const { service, selected } = await serviceFor();
  network(release([selected]), dmg(), { delay: 20 });
  const downloading = service.download();
  await new Promise((resolve) => setTimeout(resolve, 45));
  await service.cancel();
  assert.equal((await downloading).status, "cancelled");
  assert.deepEqual(await fs.readdir(path.join(state.directory, "updates/installers")), []);
  network(release([selected]));
  assert.equal((await service.download()).status, "downloaded");
});
test("network interruption and incorrect response sizes clean all partial downloads", async () => {
  for (const options of [{ interrupt: true }, {}]) {
    const { service, selected } = await serviceFor();
    network(release([selected]), options.interrupt ? dmg() : Buffer.alloc(400), options);
    assert.equal((await service.download()).status, "error");
    assert.deepEqual(await fs.readdir(path.join(state.directory, "updates/installers")), []);
  }
});
test("checksum mismatch, missing digest and invalid package format never become ready", async () => {
  const { service, selected } = await serviceFor();
  network(release([selected]), Buffer.alloc(dmg().length, 3));
  assert.equal((await service.download()).status, "error");
  network(release([{ ...selected, digest: null }]));
  assert.equal((await new api.UpdateService().check()).status, "error");
  const bytes = Buffer.alloc(2048);
  const malformed = asset(bytes, selected.name);
  network(release([malformed]), bytes);
  const other = new api.UpdateService();
  await other.check();
  assert.equal((await other.download()).status, "error");
});
test("unsafe redirects are rejected before their destination is requested", async () => {
  const { service, selected } = await serviceFor();
  globalThis.fetch = async (url) => {
    state.requests.push(String(url));
    return new Response(null, {
      status: 302,
      headers: { location: "https://evil.example/payload" },
    });
  };
  assert.equal((await service.download()).status, "error");
  assert.equal(state.requests.includes("https://evil.example/payload"), false);
  assert.deepEqual(await fs.readdir(path.join(state.directory, "updates/installers")), []);
  assert.ok(selected);
});
test("a permitted GitHub asset redirect downloads and verifies normally", async () => {
  const { service } = await serviceFor();
  globalThis.fetch = async (url, options) =>
    String(url).includes("github.com/")
      ? new Response(null, {
          status: 302,
          headers: { location: "https://release-assets.githubusercontent.com/fixture" },
        })
      : streamed(dmg(), options.signal);
  assert.equal((await service.download()).status, "downloaded");
});
test("restart preserves untracked partials and revalidates corrupted completed packages", async () => {
  const { service, selected } = await serviceFor();
  const directory = path.join(state.directory, "updates/installers");
  await fs.writeFile(path.join(directory, "interrupted.dmg.part"), "partial");
  const restarted = new api.UpdateService();
  await restarted.init();
  assert.deepEqual(await fs.readdir(directory), ["interrupted.dmg.part"]);
  await service.download();
  await fs.writeFile(path.join(directory, `${selected.id}-${selected.name}`), "damaged");
  const next = new api.UpdateService();
  assert.equal((await next.check()).status, "available");
  assert.equal((await next.download()).status, "downloaded");
});
test("path traversal, symlinks and oversized installer metadata are rejected", async () => {
  const downloader = new api.InstallerDownload(state.directory, "linux");
  await downloader.init();
  await assert.rejects(
    downloader.download(
      { ...asset(), name: "../outside.dmg" },
      new AbortController().signal,
      () => undefined,
    ),
    /filename/,
  );
  assert.equal(
    api.assetSchema.safeParse({ ...asset(), size: api.maxInstallerBytes + 1 }).success,
    false,
  );
  const outside = path.join(root, "outside.bin");
  await fs.writeFile(outside, dmg());
  const selected = asset();
  const file = path.join(state.directory, `${selected.id}-${selected.name}`);
  await fs.symlink(outside, file);
  assert.equal(await downloader.cached(selected), undefined);
  assert.equal((await fs.readFile(outside)).length, dmg().length);
});
test("supported native updater keeps explicit installation and dirty/busy guards", async () => {
  platform("linux");
  env.app.isPackaged = true;
  process.env.APPIMAGE = path.join(state.directory, "fixture.AppImage");
  await fs.writeFile(process.env.APPIMAGE, "fixture");
  const bytes = Buffer.alloc(20);
  bytes.write("\x7fELF", 0);
  bytes.write("AI\x02", 8);
  const name = `Hosts-Editor-2.3.2-linux-${process.arch}.AppImage`;
  network(release([asset(bytes, name)]), bytes);
  const service = new api.UpdateService();
  assert.equal((await service.check()).installSupported, true);
  assert.equal(updater.autoInstallOnAppQuit, false);
  assert.equal(updater.autoDownload, false);
  assert.equal((await service.download()).status, "downloaded");
  assert.throws(() => service.install(), /unsaved/);
  service.setSafety(false, true);
  assert.throws(() => service.install(), /unsaved/);
  service.setSafety(false, false);
  service.install();
  await new Promise(setImmediate);
  assert.equal(state.installed, true);
});

test("insufficient disk space and write permission failures give actionable errors", async () => {
  const { service } = await serviceFor();
  const disk = mock.method(fs, "statfs", async () => ({ bavail: 0, bsize: 4096 }));
  try {
    assert.match((await service.download()).message, /disk space/);
  } finally {
    disk.mock.restore();
  }
  const originalOpen = fs.open;
  const denied = mock.method(fs, "open", async (...args) => {
    if (String(args[0]).endsWith(".part"))
      throw Object.assign(new Error("EACCES"), { code: "EACCES" });
    return originalOpen(...args);
  });
  try {
    assert.match((await service.download()).message, /not writable/);
  } finally {
    denied.mock.restore();
  }
});
test("native cancellation uses a fresh token on retry and cannot install a cancelled download", async () => {
  platform("linux");
  env.app.isPackaged = true;
  process.env.APPIMAGE = path.join(state.directory, "fixture.AppImage");
  await fs.writeFile(process.env.APPIMAGE, "fixture");
  const bytes = Buffer.alloc(20);
  bytes.write("\x7fELF", 0);
  bytes.write("AI\x02", 8);
  network(release([asset(bytes, `Hosts-Editor-2.3.2-linux-${process.arch}.AppImage`)]), bytes);
  let rejectDownload;
  updater.checkForUpdates = async () => ({
    updateInfo: { version: "2.3.2" },
    cancellationToken: {
      cancelled: false,
      cancel() {
        this.cancelled = true;
        rejectDownload?.(new Error("cancelled"));
      },
    },
  });
  updater.downloadUpdate = async () =>
    new Promise((_resolve, reject) => {
      rejectDownload = reject;
    });
  const service = new api.UpdateService();
  await service.check();
  const pending = service.download();
  await service.cancel();
  assert.equal((await pending).status, "cancelled");
  assert.throws(() => service.install());
  rejectDownload = undefined;
  updater.downloadUpdate = async (token) => {
    assert.equal(token.cancelled, false);
    updater.emit("update-downloaded", { version: "2.3.2" });
    return [];
  };
  assert.equal((await service.download()).status, "downloaded");
});

test("manual checks retain manual origin through download and repeated checks", async () => {
  const { service } = await serviceFor();
  assert.equal(service.getState().origin, "manual");
  assert.equal((await service.check()).origin, "manual");
  await service.download();
  assert.ok(state.events.every((event) => event.origin === "manual"));
});
test("startup checks retain startup origin through download", async () => {
  platform("darwin");
  network(release([asset(dmg(), `Hosts-Editor-2.3.2-mac-${process.arch}.dmg`)]));
  const service = new api.UpdateService();
  assert.equal((await service.check("startup")).origin, "startup");
  assert.equal((await service.download()).origin, "startup");
});
test("a manual check joins an in-flight startup check and suppresses a later startup notice", async () => {
  platform("darwin");
  network(release([asset(dmg(), `Hosts-Editor-2.3.2-mac-${process.arch}.dmg`)]));
  const fetch = globalThis.fetch;
  let releaseRequest;
  const gate = new Promise((resolve) => {
    releaseRequest = resolve;
  });
  globalThis.fetch = async (...args) => {
    await gate;
    return fetch(...args);
  };
  const service = new api.UpdateService();
  const startup = service.check("startup");
  const manual = service.check();
  assert.equal(startup, manual);
  releaseRequest();
  assert.equal((await startup).origin, "manual");
  assert.equal(state.requests.length, 1);
});
test("closed renderer delivery cannot reject a check or a completed download", async () => {
  const windows = env.BrowserWindow.getAllWindows;
  env.BrowserWindow.getAllWindows = () => [
    {
      isDestroyed: () => false,
      get webContents() {
        throw new Error("Object has been destroyed");
      },
    },
  ];
  try {
    const { service } = await serviceFor();
    assert.equal((await service.download()).status, "downloaded");
  } finally {
    env.BrowserWindow.getAllWindows = windows;
  }
});
test("a revision increases monotonically across all update events", async () => {
  const { service } = await serviceFor();
  await service.download();
  for (let i = 1; i < state.events.length; i++)
    assert.ok(state.events[i].revision > state.events[i - 1].revision);
});
test("DMG installation is blocked by unsaved or busy editor state", async () => {
  const { service } = await serviceFor();
  await service.download();
  assert.equal(service.getState().handoffSupported, true);
  assert.throws(() => service.install(), /unsaved/);
  service.setSafety(false, true);
  assert.throws(() => service.install(), /unsaved/);
  assert.equal(state.quits ?? 0, 0);
});
test("DMG handoff opens successfully before one graceful quit and deduplicates requests", async () => {
  const { service } = await serviceFor();
  await service.download();
  service.setSafety(false, false);
  const first = service.install(),
    second = service.install();
  assert.equal(first, second);
  assert.equal((await first).status, "handoff");
  assert.ok(state.opened.endsWith(".dmg"));
  assert.equal(state.quits ?? 0, 0);
  await new Promise(setImmediate);
  assert.equal(state.quits, 1);
  assert.ok(state.events.some((event) => event.status === "opening"));
});
test("a failed DMG opening retains the installer and never quits", async () => {
  const { service } = await serviceFor();
  await service.download();
  state.openError = "Blocked";
  service.setSafety(false, false);
  await assert.rejects(service.install(), /remain open/);
  await new Promise(setImmediate);
  assert.equal(state.quits ?? 0, 0);
  assert.equal(service.getState().status, "downloaded");
  await service.showInFolder();
  assert.ok(state.shown);
});
test("missing installer prevents handoff and permits a fresh download", async () => {
  const { service, selected } = await serviceFor();
  await service.download();
  await fs.unlink(
    path.join(state.directory, "updates/installers", `${selected.id}-${selected.name}`),
  );
  service.setSafety(false, false);
  await assert.rejects(service.install());
  assert.equal(state.quits ?? 0, 0);
  assert.equal((await service.download()).status, "downloaded");
});
test("ordinary installer opening is deduplicated and cannot race handoff", async () => {
  const { service } = await serviceFor();
  await service.download();
  service.setSafety(false, false);
  let finish;
  const original = env.shell.openPath;
  env.shell.openPath = async () =>
    new Promise((resolve) => {
      finish = () => resolve("");
    });
  try {
    const first = service.open(),
      second = service.open();
    assert.equal(first, second);
    assert.throws(() => service.install(), /already in progress/);
    while (!finish) await new Promise(setImmediate);
    finish();
    await first;
    assert.equal(state.quits ?? 0, 0);
  } finally {
    env.shell.openPath = original;
  }
});
test("restarting without installation retains a verified future installer", async () => {
  const { service } = await serviceFor();
  await service.download();
  const restarted = new api.UpdateService();
  assert.equal((await restarted.check()).status, "downloaded");
  assert.equal(state.requests.filter((url) => !url.includes("api.github.com")).length, 1);
});
test("running the installed version cleans only tracked obsolete packages", async () => {
  const { service } = await serviceFor();
  await service.download();
  const directory = path.join(state.directory, "updates/installers");
  await fs.writeFile(path.join(directory, "untracked.dmg"), "leave me");
  state.runningVersion = "2.3.2";
  const restarted = new api.UpdateService();
  await restarted.init();
  assert.deepEqual(await fs.readdir(directory), ["untracked.dmg"]);
});
test("tracked interrupted downloads are removed while unrelated partials survive", async () => {
  const { service, selected } = await serviceFor();
  network(release([selected]), dmg(), { delay: 20 });
  const pending = service.download();
  await new Promise((resolve) => setTimeout(resolve, 45));
  await service.cancel();
  await pending;
  const directory = path.join(state.directory, "updates/installers");
  await fs.writeFile(path.join(directory, `${selected.id}-${selected.name}.part`), "interrupted");
  await fs.writeFile(path.join(directory, "not-owned.part"), "preserve");
  await new api.UpdateService().init();
  assert.deepEqual(await fs.readdir(directory), ["not-owned.part"]);
});
test("cleanup refuses a tracked symlink and does not touch its external target", async () => {
  const { service, selected } = await serviceFor();
  await service.download();
  const file = path.join(state.directory, "updates/installers", `${selected.id}-${selected.name}`);
  const outside = path.join(state.directory, "outside.txt");
  await fs.writeFile(outside, "preserve");
  await fs.unlink(file);
  await fs.symlink(outside, file);
  state.runningVersion = "2.3.2";
  await new api.UpdateService().init();
  assert.equal(await fs.readFile(outside, "utf8"), "preserve");
  assert.equal((await fs.lstat(file)).isSymbolicLink(), true);
});
test("malicious cleanup metadata cannot traverse outside the managed directory", async () => {
  const { service } = await serviceFor();
  const outside = path.join(state.directory, "outside.dmg");
  await fs.writeFile(outside, "preserve");
  await fs.writeFile(
    path.join(state.directory, "updates/installer-index.json"),
    JSON.stringify({
      format: 1,
      entries: [{ version: "2.3.2", asset: { ...asset(), name: "../../outside.dmg" } }],
    }),
  );
  await assert.rejects(new api.UpdateService().init(), /index/);
  assert.equal(await fs.readFile(outside, "utf8"), "preserve");
  assert.ok(service);
});
test("cleanup failures do not block initialization and keep the package for retry", async () => {
  const { service, selected } = await serviceFor();
  await service.download();
  state.runningVersion = "2.3.2";
  const unlink = fs.unlink;
  mock.method(fs, "unlink", async (file) => {
    if (String(file).endsWith(".dmg")) throw Object.assign(new Error("Busy"), { code: "EBUSY" });
    return unlink(file);
  });
  try {
    await new api.UpdateService().init();
    assert.ok(
      await fs.stat(
        path.join(state.directory, "updates/installers", `${selected.id}-${selected.name}`),
      ),
    );
  } finally {
    mock.restoreAll();
  }
});
test("shutdown cancels active streams and suppresses later renderer events", async () => {
  const { service, selected } = await serviceFor();
  network(release([selected]), dmg(), { delay: 20 });
  const pending = service.download();
  await new Promise((resolve) => setTimeout(resolve, 45));
  const count = state.events.length;
  await service.shutdown();
  await pending;
  assert.equal(state.events.length, count);
  assert.deepEqual(await fs.readdir(path.join(state.directory, "updates/installers")), []);
  assert.equal(state.quits ?? 0, 0);
});
test("2.3.3 DMGs are recognized on both supported macOS architectures", () => {
  for (const arch of ["arm64", "x64"]) {
    const name = `Hosts-Editor-2.3.3-mac-${arch}.dmg`;
    const selected = {
      ...asset(dmg(), name),
      browser_download_url: `https://github.com/michalskirobert/hosts-editor/releases/download/v2.3.3/${name}`,
    };
    assert.equal(api.selectReleaseAssetInfo([selected], "2.3.3", "darwin", arch)?.name, name);
  }
});

test("startup notification acknowledgement survives another check in the same main-process session", async () => {
  platform("darwin");
  network(release([asset(dmg(), `Hosts-Editor-2.3.2-mac-${process.arch}.dmg`)]));
  const service = new api.UpdateService();
  assert.equal((await service.check("startup")).noticePending, true);
  assert.equal(service.acknowledgeNotice("2.3.2").noticePending, false);
  assert.equal((await service.download()).noticePending, false);
  assert.equal(service.getState().origin, "startup");
});

test("macOS ZIP fallback also requires the guarded graceful handoff", async () => {
  platform("darwin");
  const bytes = Buffer.alloc(2048);
  bytes.writeUInt32LE(0x04034b50);
  const selected = asset(bytes, `Hosts-Editor-2.3.2-mac-${process.arch}.zip`);
  network(release([selected]), bytes);
  const service = new api.UpdateService();
  assert.equal((await service.check()).handoffSupported, true);
  await service.download();
  service.setSafety(false, false);
  assert.equal((await service.install()).status, "handoff");
  await new Promise(setImmediate);
  assert.equal(state.quits, 1);
});

for (const target of ["win32", "linux"]) {
  test(`${target} direct installer keeps open/reveal behavior without quitting`, async () => {
    const bytes = Buffer.alloc(2048);
    bytes.write(target === "win32" ? "MZ" : "!<arch>\n");
    const { service } = await serviceFor(target, bytes);
    assert.equal(service.getState().installSupported, false);
    assert.equal(service.getState().handoffSupported, false);
    assert.equal((await service.download()).status, "downloaded");
    await service.open();
    await service.showInFolder();
    assert.equal(state.opened, state.shown);
    assert.equal(state.quits ?? 0, 0);
  });
}

test("signed installed Windows NSIS retains explicit native installation", async () => {
  platform("win32");
  const descriptor = Object.getOwnPropertyDescriptor(process, "resourcesPath");
  Object.defineProperty(process, "resourcesPath", { value: state.directory, configurable: true });
  env.app.isPackaged = true;
  try {
    await fs.writeFile(path.join(state.directory, "Uninstall Hosts Editor.exe"), "fixture");
    await fs.writeFile(path.join(state.directory, "app-update.yml"), "publisherName: NurByte\n");
    const bytes = Buffer.alloc(2048);
    bytes.write("MZ");
    const { service } = await serviceFor("win32", bytes);
    assert.equal(service.getState().installSupported, true);
    await service.download();
    assert.equal(state.installed, undefined);
    service.setSafety(false, false);
    service.install();
    await new Promise(setImmediate);
    assert.equal(state.installed, true);
    assert.equal(state.quits ?? 0, 0);
  } finally {
    if (descriptor) Object.defineProperty(process, "resourcesPath", descriptor);
    else delete process.resourcesPath;
  }
});

test("handoff rejects an installer if the current process architecture no longer matches", async () => {
  const { service } = await serviceFor();
  await service.download();
  service.setSafety(false, false);
  const descriptor = Object.getOwnPropertyDescriptor(process, "arch");
  try {
    Object.defineProperty(process, "arch", { value: process.arch === "arm64" ? "x64" : "arm64" });
    await assert.rejects(service.install(), /not compatible/);
    assert.equal(state.quits ?? 0, 0);
  } finally {
    Object.defineProperty(process, "arch", descriptor);
  }
});

test("a failed exclusive finalization never claims or later deletes an untracked existing file", async () => {
  const { service, selected } = await serviceFor();
  const directory = path.join(state.directory, "updates/installers");
  const target = path.join(directory, `${selected.id}-${selected.name}`);
  await fs.writeFile(target, "untracked existing content");
  assert.equal((await service.download()).status, "error");
  state.runningVersion = "2.3.2";
  await new api.UpdateService().init();
  assert.equal(await fs.readFile(target, "utf8"), "untracked existing content");
  assert.equal(
    (await fs.readdir(directory)).some((name) => name.endsWith(".part")),
    false,
  );
});
