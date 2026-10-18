import assert from "node:assert/strict";
import { test } from "node:test";
import { EventEmitter } from "node:events";
import { build } from "esbuild";
import path from "node:path";
import { readFile } from "node:fs/promises";

test("before-quit drains updates once and resumes graceful quit without forceful exit", async () => {
  const app = new EventEmitter();
  let completeShutdown;
  const shutdownGate = new Promise((resolve) => {
    completeShutdown = resolve;
  });
  const fixture = { app, shutdownCalls: 0, quitCalls: 0, completedQuits: 0 };
  app.requestSingleInstanceLock = () => true;
  app.whenReady = () => new Promise(() => undefined);
  app.quit = () => {
    fixture.quitCalls++;
    const event = {
      prevented: false,
      preventDefault() {
        this.prevented = true;
      },
    };
    app.emit("before-quit", event);
    if (!event.prevented) {
      fixture.completedQuits++;
      app.emit("will-quit");
    }
  };
  fixture.shutdown = () => {
    fixture.shutdownCalls++;
    return shutdownGate;
  };
  globalThis.hostsLifecycleTest = fixture;
  try {
    const bundle = await build({
      entryPoints: ["src/main/index.ts"],
      bundle: true,
      write: false,
      platform: "node",
      format: "esm",
      plugins: [
        {
          name: "lifecycle-fixtures",
          setup(builder) {
            builder.onResolve({ filter: /^(electron|\.\/)/ }, (args) =>
              args.kind === "entry-point"
                ? undefined
                : {
                    path: args.path,
                    namespace: "lifecycle-fixture",
                  },
            );
            builder.onLoad({ filter: /.*/, namespace: "lifecycle-fixture" }, ({ path: name }) => ({
              contents:
                name === "electron"
                  ? "export const app=globalThis.hostsLifecycleTest.app;export const dialog={showErrorBox(){}};"
                  : name.includes("updateService")
                    ? "export class UpdateService {shutdown(){return globalThis.hostsLifecycleTest.shutdown();}}"
                    : name.includes("storageService")
                      ? "export class StorageService {}"
                      : name.includes("hostsService")
                        ? "export class HostsService {}"
                        : name.includes("register")
                          ? "export const registerIpc=()=>{};"
                          : "export const createWindow=async()=>{}; export const createSplashWindow=async()=>{};",
              loader: "js",
            }));
          },
        },
      ],
    });
    await import(
      "data:text/javascript;base64," + Buffer.from(bundle.outputFiles[0].text).toString("base64")
    );
    app.quit();
    assert.equal(fixture.completedQuits, 0);
    app.quit();
    assert.equal(fixture.shutdownCalls, 1);
    completeShutdown();
    await new Promise(setImmediate);
    assert.equal(fixture.completedQuits, 1);
    assert.equal(fixture.shutdownCalls, 1);
  } finally {
    delete globalThis.hostsLifecycleTest;
  }
});

test("an older IPC snapshot cannot replace newer progress after navigation", async () => {
  const source = await readFile("src/renderer/src/hooks/useAppState.ts", "utf8");
  const bundle = await build({
    stdin: {
      contents: source + "\nexport {reducer,initialState};",
      loader: "ts",
      resolveDir: path.resolve("src/renderer/src/hooks"),
    },
    bundle: true,
    write: false,
    platform: "node",
    format: "esm",
    banner: {
      js: `import {createRequire} from "node:module";const require=createRequire(${JSON.stringify(path.resolve("package.json"))});`,
    },
  });
  const { reducer, initialState } = await import(
    "data:text/javascript;base64," + Buffer.from(bundle.outputFiles[0].text).toString("base64")
  );
  const downloading = reducer(initialState, {
    type: "patch",
    value: {
      update: {
        status: "downloading",
        revision: 10,
        progress: { percent: 73, transferred: 73, total: 100 },
      },
    },
  });
  const stale = reducer(downloading, {
    type: "patch",
    value: { page: "settings", update: { status: "available", revision: 9 } },
  });
  assert.equal(stale.page, "settings");
  assert.equal(stale.update.status, "downloading");
  assert.equal(stale.update.progress.percent, 73);
});
