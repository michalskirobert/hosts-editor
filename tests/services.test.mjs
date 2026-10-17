import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { EventEmitter } from "node:events";
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import AdmZip from "adm-zip";

const root = await fs.mkdtemp(path.join(os.tmpdir(), "hosts-editor-tests-"));
const hostsBefore = await fs.readFile("/etc/hosts").catch(() => Buffer.alloc(0));
const updater = new EventEmitter();
let state;
let storage;
const env = {
  app: {
    isPackaged: false,
    getVersion: () => "2.3.0",
    getPath: (name) =>
      name === "exe" ? path.join(state.directory, "Hosts Editor.exe") : state.directory,
  },
  BrowserWindow: {
    getAllWindows: () => [],
    fromWebContents: (sender) => (sender.trusted ? {} : null),
    getFocusedWindow: () => undefined,
  },
  dialog: { showOpenDialog: async () => state.open, showSaveDialog: async () => state.save },
  shell: {
    openExternal: async (url) => {
      state.url = url;
    },
    openPath: async () => "",
  },
  ipcMain: {
    handle: (name, listener) => {
      state.handlers.set(name, listener);
    },
  },
  nativeTheme: {},
  updater,
  execFile: (file, args, callback) => {
    state.commands.push({ file, args });
    callback(null, "", "");
  },
};
globalThis.hostsEditorTest = env;
const bundle = path.join(root, "services.mjs");
await build({
  stdin: {
    contents: `export {StorageService} from "./src/main/services/storage/storageService.ts"; export {HostsService} from "./src/main/services/hosts/hostsService.ts"; export {UpdateService} from "./src/main/services/update/updateService.ts"; export {registerIpc} from "./src/main/ipc/register.ts"; export * from "./src/main/services/update/release.ts"; export * from "./src/shared/domain/hosts.ts"; export * from "./src/renderer/src/lib/search.ts";`,
    resolveDir: process.cwd(),
  },
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: bundle,
  banner: {
    js: `import { createRequire } from 'node:module'; const require = createRequire(${JSON.stringify(path.join(process.cwd(), "package.json"))});`,
  },
  plugins: [
    {
      name: "isolated-platforms",
      setup(builder) {
        builder.onResolve(
          { filter: /^(electron|electron-updater|node:child_process)$/ },
          (args) => ({ path: args.path, namespace: "test" }),
        );
        builder.onLoad({ filter: /.*/, namespace: "test" }, ({ path: name }) => ({
          contents:
            name === "electron"
              ? "export const {app,BrowserWindow,dialog,shell,ipcMain,nativeTheme} = globalThis.hostsEditorTest;"
              : name === "electron-updater"
                ? "export default {autoUpdater:globalThis.hostsEditorTest.updater};"
                : "export const execFile = globalThis.hostsEditorTest.execFile;",
          loader: "js",
        }));
      },
    },
  ],
});
const api = await import(pathToFileURL(bundle).href);
const originalFetch = globalThis.fetch;
const originalAppImage = process.env.APPIMAGE;
beforeEach(async () => {
  updater.removeAllListeners();
  state = {
    directory: path.join(root, randomUUID()),
    open: { canceled: true, filePaths: [] },
    save: { canceled: true },
    commands: [],
    handlers: new Map(),
  };
  env.app.isPackaged = false;
  delete process.env.APPIMAGE;
  globalThis.fetch = originalFetch;
  updater.checkForUpdates = async () => {
    updater.emit("update-available", { version: "2.4.0" });
    return {};
  };
  updater.downloadUpdate = async () => {
    updater.emit("download-progress", { percent: 42, transferred: 42, total: 100 });
    updater.emit("update-downloaded", { version: "2.4.0" });
    return [];
  };
  updater.quitAndInstall = () => {
    state.installed = true;
  };
  storage = new api.StorageService();
  await storage.init();
});
after(async () => {
  assert.deepEqual(await fs.readFile("/etc/hosts").catch(() => Buffer.alloc(0)), hostsBefore);
  globalThis.fetch = originalFetch;
  if (originalAppImage === undefined) delete process.env.APPIMAGE;
  else process.env.APPIMAGE = originalAppImage;
  delete globalThis.hostsEditorTest;
  await fs.rm(root, { recursive: true, force: true });
});

const tab = async (text = "127.0.0.1 localhost\n::1 localhost") =>
  storage.createTab("Fixture", text);
test("hosts text keeps tabs, spaces, comments and incomplete edits unchanged", () => {
  const text = "# fixture\n127.0.0.1\tlocalhost alias.test  # note\n\n# ::1 ipv6.test\n127.0.0.\n";
  assert.equal(api.serializeLines(api.parseHostsText(text)), text);
  assert.match(api.getHostLineError(api.parseHostsText("127.0.0.")[0]), /Unrecognized/);
});
test("structured edits serialize only changed entries", () => {
  const lines = api.parseHostsText("127.0.0.1\tlocalhost\n::1\tlocal.test");
  assert.equal(
    api.serializeLines([{ ...lines[0], hostname: "changed.test" }, lines[1]]),
    "127.0.0.1 changed.test\n::1\tlocal.test",
  );
});
test("empty, disabled and invalid hosts saves never execute privileged commands", async () => {
  const service = new api.HostsService();
  await assert.rejects(service.apply([]), /empty content/);
  await assert.rejects(service.apply([{ ...(await tab()), enabled: false }]), /empty content/);
  await assert.rejects(service.apply([await tab("broken mapping")]), /Unrecognized/);
  assert.equal(state.commands.length, 0);
});
test("Linux save stages content, retains recovery backup and never redirects into hosts", async (context) => {
  if (process.platform !== "linux") return context.skip("Linux command generation");
  await new api.HostsService().apply([await tab()]);
  const command = state.commands[0].args[2];
  assert.match(command, /mktemp/);
  assert.match(command, /test -s/);
  assert.match(command, /hosts-editor.backup/);
  assert.match(command, /mv -f/);
  assert.doesNotMatch(command, />\s*\/etc\/hosts/);
});
test("literal Unicode search preserves offsets, special characters and multiline matches", () => {
  assert.deepEqual(api.findTextMatches("İX\nA.*b a.*B", "a.*b"), [
    { start: 3, end: 7 },
    { start: 8, end: 12 },
  ]);
  assert.deepEqual(api.findTextMatches("a\nb\na\nb", "a\nb"), [
    { start: 0, end: 3 },
    { start: 4, end: 7 },
  ]);
  assert.deepEqual(api.findTextMatches("test", ""), []);
});
test("manual backup, restore and JSON export do not apply system hosts", async () => {
  const original = await tab();
  const backup = await storage.createBackup(original, "manual");
  await storage.saveTab({ ...original, name: "Changed" });
  assert.equal((await storage.restoreBackup(backup)).name, "Fixture");
  state.save = { canceled: false, filePath: path.join(state.directory, "export.json") };
  assert.equal(await storage.exportBackup(backup), true);
  assert.equal(JSON.parse(await fs.readFile(state.save.filePath, "utf8")).tab.id, original.id);
  assert.equal(state.commands.length, 0);
});
test("daily backups deduplicate and retention never deletes manual backups", async () => {
  const original = await tab();
  const manual = await storage.createBackup(original, "manual");
  await storage.saveTab(original, true);
  await storage.saveTab(original, true);
  assert.equal(
    (await storage.listBackups()).filter((item) => item.reason === "auto-save").length,
    1,
  );
  const directory = path.dirname(manual.path);
  for (let day = 1; day <= 9; day += 1) {
    await fs.writeFile(
      path.join(directory, `old-${day}.json`),
      JSON.stringify({
        reason: "auto-save",
        createdAt: `2020-01-${String(day).padStart(2, "0")}T00:00:00.000Z`,
        tab: original,
      }),
    );
  }
  const current = (await storage.listBackups()).find(
    (item) => item.reason === "auto-save" && !item.fileName.startsWith("old-"),
  );
  await storage.deleteBackup(current);
  await storage.saveTab(original, true);
  assert.equal(
    (await storage.listBackups()).filter((item) => item.reason === "auto-save").length,
    7,
  );
  await fs.access(manual.path);
});
test("ZIP export/import handles duplicates without restoring tabs", async () => {
  const original = await tab();
  await storage.createBackup(original, "manual");
  state.save = { canceled: false, filePath: path.join(state.directory, "export.zip") };
  assert.equal(await storage.exportAllBackups(), true);
  state.open = { canceled: false, filePaths: [state.save.filePath] };
  assert.equal((await storage.importBackups()).skipped, 1);
  assert.equal((await storage.listTabs()).length, 1);
  assert.equal(state.commands.length, 0);
});
test("JSON import validates data, keeps distinct same-timestamp snapshots, and is idempotent", async () => {
  const original = await tab();
  const stamp = "2026-01-01T00:00:00.000Z";
  const file = path.join(state.directory, "import.json");
  state.open = { canceled: false, filePaths: [file] };
  for (const name of ["first.test", "second.test"]) {
    await fs.writeFile(
      file,
      JSON.stringify({
        reason: "manual",
        createdAt: stamp,
        tab: { ...original, lines: api.parseHostsText(`127.0.0.1 ${name}`) },
      }),
    );
    assert.equal((await storage.importBackups()).imported, 1);
  }
  assert.equal((await storage.listBackups()).length, 2);
  assert.equal((await storage.importBackups()).skipped, 1);
  assert.equal(
    api.serializeLines((await storage.listTabs())[0].lines),
    api.serializeLines(original.lines),
  );
  await fs.writeFile(file, '{"tab":{}}');
  await assert.rejects(storage.importBackups(), /Invalid/);
});
test("archive manifest counts and uncompressed sizes are checked", async () => {
  const archive = new AdmZip();
  archive.addFile(
    "manifest.json",
    Buffer.from(
      JSON.stringify({
        format: "hosts-editor-backup-archive",
        formatVersion: 1,
        createdAt: new Date().toISOString(),
        backupCount: 1,
      }),
    ),
  );
  const file = path.join(state.directory, "invalid.zip");
  archive.writeZip(file);
  state.open = { canceled: false, filePaths: [file] };
  await assert.rejects(storage.importBackups(), /count/);
  const large = new AdmZip();
  large.addFile("manifest.json", archive.getEntry("manifest.json").getData());
  large.addFile("backups/large.json", Buffer.alloc(2 * 1024 * 1024 + 1));
  large.writeZip(file);
  await assert.rejects(storage.importBackups(), /allowed size/);
});
test("backup paths outside the managed directory cannot be read or deleted", async () => {
  const backup = await storage.createBackup(await tab());
  const outside = path.join(state.directory, "keep.json");
  await fs.writeFile(outside, "{}");
  await assert.rejects(storage.readBackup({ ...backup, path: outside }), /Invalid backup path/);
  await assert.rejects(storage.deleteBackup({ ...backup, path: outside }), /Invalid backup path/);
  assert.equal(await fs.readFile(outside, "utf8"), "{}");
});
test("concurrent draft writes remain atomic and leave the latest requested content", async () => {
  const original = await tab();
  await Promise.all(
    Array.from({ length: 20 }, (_, index) =>
      storage.saveTab({ ...original, name: `Revision ${index}` }),
    ),
  );
  assert.equal((await storage.listTabs())[0].name, "Revision 19");
  assert.equal((await fs.readdir(path.join(state.directory, "v2/tabs"))).length, 1);
});
test("IPC rejects untrusted senders and invalid operation payloads", async () => {
  const updates = new api.UpdateService();
  api.registerIpc(storage, new api.HostsService(), updates);
  const frame = {};
  const trusted = { sender: { trusted: true, mainFrame: frame }, senderFrame: frame };
  assert.throws(
    () => state.handlers.get("tabs:save")({ sender: { trusted: false } }, {}),
    /Untrusted/,
  );
  assert.throws(() => state.handlers.get("update:safety")(trusted, "false", false));
  assert.throws(() => state.handlers.get("tabs:save")(trusted, {}));
  assert.doesNotThrow(() => state.handlers.get("update:safety")(trusted, false, false));
});
test("macOS and Windows privileged writers stage replacements without writing test hosts", async () => {
  const descriptor = Object.getOwnPropertyDescriptor(process, "platform");
  try {
    for (const platform of ["darwin", "win32"]) {
      Object.defineProperty(process, "platform", { value: platform });
      await new api.HostsService().apply([await tab()]);
    }
    assert.match(state.commands[0].args[1], /mktemp/);
    assert.match(state.commands[0].args[1], /hosts-editor.backup/);
    const command = state.commands[1].args.at(-1);
    assert.match(command, /ExitCode/);
    const encoded = command.match(/EncodedCommand','([^']+)'/)[1];
    const script = Buffer.from(encoded, "base64").toString("utf16le");
    assert.match(script, /WriteAllBytes/);
    assert.match(script, /File\]::Replace/);
    assert.match(script, /finally/);
    assert.doesNotMatch(script, /WriteAllText/);
  } finally {
    Object.defineProperty(process, "platform", descriptor);
  }
});
test("test fixtures leave the real system hosts file unchanged", async () => {
  const digest = (value) => createHash("sha256").update(value).digest("hex");
  assert.equal(digest(await fs.readFile("/etc/hosts")), digest(hostsBefore));
});
