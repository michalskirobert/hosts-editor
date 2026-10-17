import { BrowserWindow, nativeTheme } from "electron";
import { is } from "@electron-toolkit/utils";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { AppSettings } from "../../shared/types";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

const workspaceReadyScript = `
  new Promise((resolve) => {
    let finished = false;

    const observer = new MutationObserver(check);

    function check() {
      if (finished) return;

      const root = document.querySelector("[data-startup-state]");
      const state = root?.getAttribute("data-startup-state");

      if (state !== "ready" && state !== "failed") return;

      finished = true;
      observer.disconnect();

      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve(state));
      });
    }

    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-startup-state"],
    });

    check();
  })
`;

const loadRenderer = async (
  window: BrowserWindow,
  filename: "index.html" | "splash.html",
): Promise<void> => {
  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    const base = process.env.ELECTRON_RENDERER_URL;
    const url = new URL(filename, base.endsWith("/") ? base : `${base}/`);

    await window.loadURL(url.toString());
    return;
  }

  await window.loadFile(path.join(currentDirectory, "../renderer", filename));
};

const restrictNavigation = (window: BrowserWindow): void => {
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));

  window.webContents.on("will-navigate", (event, url) => {
    if (url !== window.webContents.getURL()) event.preventDefault();
  });
};

export const createSplashWindow = async (): Promise<BrowserWindow> => {
  const window = new BrowserWindow({
    width: 440,
    height: 340,
    center: true,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    hasShadow: false,
    show: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
    },
  });

  restrictNavigation(window);

  try {
    await loadRenderer(window, "splash.html");

    if (window.isDestroyed()) {
      throw new Error("The startup window was closed.");
    }

    window.show();
    return window;
  } catch (error: unknown) {
    if (!window.isDestroyed()) window.destroy();
    throw error;
  }
};

export const createWindow = async (settings: AppSettings): Promise<BrowserWindow> => {
  nativeTheme.themeSource = settings.theme;

  const window = new BrowserWindow({
    width: 1320,
    height: 840,
    minWidth: 1000,
    minHeight: 650,
    show: false,
    fullscreenable: true,
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#090d14" : "#f5f7fb",
    webPreferences: {
      preload: path.join(currentDirectory, "../preload/index.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false,
    },
  });

  restrictNavigation(window);

  window.webContents.on("before-input-event", (event, input) => {
    if (input.type === "keyDown" && input.key === "F12") {
      event.preventDefault();
      window.webContents.toggleDevTools();
    }
  });

  let timeout: ReturnType<typeof setTimeout> | undefined;
  let rejectStartup: (error: Error) => void = () => undefined;

  const interrupted = new Promise<never>((_resolve, reject) => {
    rejectStartup = reject;
  });

  const onClosed = (): void => {
    rejectStartup(new Error("The application window was closed during startup."));
  };

  const onRendererGone = (): void => {
    rejectStartup(new Error("The application interface stopped during startup."));
  };

  window.once("closed", onClosed);
  window.webContents.once("render-process-gone", onRendererGone);

  try {
    const deadline = new Promise<never>((_resolve, reject) => {
      timeout = setTimeout(() => {
        reject(new Error("The application interface did not finish loading."));
      }, 45_000);
    });

    const loadWorkspace = async (): Promise<void> => {
      await loadRenderer(window, "index.html");
      await window.webContents.executeJavaScript(workspaceReadyScript);
    };

    await Promise.race([loadWorkspace(), deadline, interrupted]);

    if (window.isDestroyed()) {
      throw new Error("The application window is unavailable.");
    }

    window.show();

    if (settings.fullscreen) {
      window.setFullScreen(true);
    }

    return window;
  } catch (error: unknown) {
    if (!window.isDestroyed()) window.destroy();
    throw error;
  } finally {
    if (timeout) clearTimeout(timeout);

    if (!window.isDestroyed()) {
      window.removeListener("closed", onClosed);

      if (!window.webContents.isDestroyed()) {
        window.webContents.removeListener("render-process-gone", onRendererGone);
        window.webContents.setBackgroundThrottling(true);
      }
    }
  }
};
