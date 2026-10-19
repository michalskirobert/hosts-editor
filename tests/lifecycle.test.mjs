import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { EventEmitter } from "node:events";
import { build } from "esbuild";
import path from "node:path";
import { readFile } from "node:fs/promises";

let sequence = 0;

const waitFor = async (condition) => {
  for (let attempt = 0; attempt < 50; attempt++) {
    if (condition()) return;
    await new Promise(setImmediate);
  }

  assert.fail("The expected lifecycle state was not reached.");
};

const loadMain = async ({ packaged = true, lock = true, failure = "" } = {}) => {
  const app = new EventEmitter();

  let ready;
  let finishShutdown;

  const shutdownGate = new Promise((resolve) => {
    finishShutdown = resolve;
  });

  const fixture = {
    app,
    failure,
    errors: [],
    logs: [],
    paths: [],
    directories: [],
    actions: [],
    shutdownCalls: 0,
    completedQuits: 0,
    initialized: false,
    shutdown() {
      this.shutdownCalls++;
      return shutdownGate;
    },
  };

  const logMocks = ["info", "warn", "error", "trace"].map((level) =>
    mock.method(console, level, (...values) => {
      fixture.logs.push({ level, values });
    }),
  );

  app.isPackaged = packaged;
  app.getPath = () => path.resolve("isolated-test-data");

  app.setPath = (name, value) => {
    fixture.paths.push({ name, value });
    fixture.actions.push("path");
  };

  app.requestSingleInstanceLock = () => {
    fixture.actions.push("lock");
    return lock;
  };

  app.whenReady = () =>
    new Promise((resolve) => {
      ready = resolve;
    });

  app.quit = () => {
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
      app.emit("quit", {}, 0);
    }
  };

  fixture.createWindow = () => {
    const window = new EventEmitter();
    let destroyed = false;

    Object.assign(window, {
      isDestroyed: () => destroyed,
      destroy: () => {
        destroyed = true;
      },
      isMinimized: () => false,
      show: () => undefined,
      focus: () => undefined,
      restore: () => undefined,
      webContents: new EventEmitter(),
    });

    return window;
  };

  const previousListeners = new Set(process.listeners("uncaughtExceptionMonitor"));

  globalThis.hostsLifecycleTest = fixture;

  const mainSource = await readFile("src/main/index.ts", "utf8");

  try {
    const bundle = await build({
      stdin: {
        contents: mainSource,
        loader: "ts",
        resolveDir: path.resolve("src/main"),
      },
      bundle: true,
      write: false,
      platform: "node",
      format: "esm",
      plugins: [
        {
          name: "lifecycle-fixtures",
          setup(builder) {
            builder.onResolve({ filter: /^(electron$|node:fs$|\.\/)/ }, (args) => ({
              path: args.path,
              namespace: "lifecycle-fixture",
            }));

            builder.onLoad({ filter: /.*/, namespace: "lifecycle-fixture" }, ({ path: name }) => ({
              contents:
                name === "electron"
                  ? "export const app=globalThis.hostsLifecycleTest.app;export const dialog={showErrorBox(title,message){globalThis.hostsLifecycleTest.errors.push(message);}};"
                  : name === "node:fs"
                    ? "export default {mkdirSync(directory){globalThis.hostsLifecycleTest.directories.push(directory);}};"
                    : name.includes("updateService")
                      ? 'if(globalThis.hostsLifecycleTest.failure==="import")throw new Error("Update import failed");export class UpdateService {constructor(){if(globalThis.hostsLifecycleTest.failure==="constructor")throw new Error("Update constructor failed");}async init(){globalThis.hostsLifecycleTest.initialized=true;}shutdown(){return globalThis.hostsLifecycleTest.shutdown();}}'
                      : name.includes("storageService")
                        ? 'export class StorageService {async init(){if(globalThis.hostsLifecycleTest.failure==="storage")throw new Error("Storage failed");}async getSettings(){return {checkForUpdates:false};}}'
                        : name.includes("hostsService")
                          ? "export class HostsService {}"
                          : name.includes("register")
                            ? "export const registerIpc=()=>{};"
                            : "export const createWindow=async()=>globalThis.hostsLifecycleTest.createWindow();export const createSplashWindow=async()=>globalThis.hostsLifecycleTest.createWindow();",
              loader: "js",
            }));
          },
        },
      ],
    });

    await import(
      "data:text/javascript;base64," +
        Buffer.from(bundle.outputFiles[0].text).toString("base64") +
        "#" +
        String(++sequence)
    );
  } catch (error) {
    delete globalThis.hostsLifecycleTest;

    for (const method of logMocks) method.mock.restore();

    for (const listener of process.listeners("uncaughtExceptionMonitor")) {
      if (!previousListeners.has(listener)) {
        process.removeListener("uncaughtExceptionMonitor", listener);
      }
    }

    throw error;
  }

  return {
    fixture,
    ready: () => ready(),
    finishShutdown,
    cleanup() {
      for (const listener of process.listeners("uncaughtExceptionMonitor")) {
        if (!previousListeners.has(listener)) {
          process.removeListener("uncaughtExceptionMonitor", listener);
        }
      }

      delete globalThis.hostsLifecycleTest;

      for (const method of logMocks) method.mock.restore();
    },
  };
};

test("before-quit drains initialized updates once and resumes graceful quit", async () => {
  const run = await loadMain();

  try {
    run.ready();
    await waitFor(() => run.fixture.initialized);

    run.fixture.app.quit();
    run.fixture.app.quit();

    assert.equal(run.fixture.completedQuits, 0);
    assert.equal(run.fixture.shutdownCalls, 1);

    run.finishShutdown();

    await waitFor(() => run.fixture.completedQuits === 1);

    assert.equal(run.fixture.shutdownCalls, 1);
    assert.deepEqual(run.fixture.paths, []);
  } finally {
    run.cleanup();
  }
});

test("development preserves the existing userData path when another instance holds the lock", async () => {
  const run = await loadMain({ packaged: false, lock: false });

  try {
    await waitFor(() => run.fixture.completedQuits === 1);

    assert.deepEqual(run.fixture.paths, []);
    assert.deepEqual(run.fixture.directories, []);
    assert.deepEqual(run.fixture.actions, ["lock"]);
    assert.equal(run.fixture.shutdownCalls, 0);
  } finally {
    run.cleanup();
  }
});

for (const failure of ["import", "constructor", "storage"]) {
  test("startup reports " + failure + " failure and exits gracefully", async () => {
    const run = await loadMain({ failure });

    try {
      run.ready();

      await waitFor(() => run.fixture.errors.length === 1);

      if (run.fixture.shutdownCalls) run.finishShutdown();

      await waitFor(() => run.fixture.completedQuits === 1);

      assert.match(run.fixture.errors[0], /failed/i);
    } finally {
      run.cleanup();
    }
  });
}

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
