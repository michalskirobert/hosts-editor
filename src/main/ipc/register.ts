import { app, BrowserWindow, ipcMain, nativeTheme, shell, type IpcMainInvokeEvent } from "electron";

import { IPC } from "../../shared/contracts/ipc";
import { z } from "zod";
import {
  backupInfoSchema,
  backupReasonSchema,
  feedbackSubmissionSchema,
  hostTabSchema,
  settingsSchema,
} from "../../shared/contracts/schemas";
import type { HostsService } from "../services/hosts/hostsService";
import type { StorageService } from "../services/storage/storageService";
import type { UpdateService } from "../services/update/updateService";
import { FeedbackService } from "../services/feedbackService";

export const registerIpc = (
  storage: StorageService,
  hosts: HostsService,
  updates: UpdateService,
): void => {
  const feedback = new FeedbackService();
  const handle = <Args extends unknown[]>(
    channel: string,
    schema: z.ZodType<Args>,
    listener: (event: IpcMainInvokeEvent, ...args: Args) => unknown,
  ): void => {
    ipcMain.handle(channel, (event, ...input: unknown[]) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window || event.senderFrame !== event.sender.mainFrame)
        throw new Error("Untrusted IPC sender.");
      return listener(event, ...schema.parse(input));
    });
  };
  const empty = z.tuple([]);
  handle(IPC.bootstrap, empty, async () => ({
    tabs: await storage.listTabs(),
    settings: await storage.getSettings(),
    hostsPath: hosts.path(),
    version: app.getVersion(),
  }));
  handle(
    IPC.tabCreate,
    z.tuple([z.string().max(200), z.string().max(2 * 1024 * 1024)]),
    (_event, name, text) => storage.createTab(name, text),
  );
  handle(IPC.tabSave, z.tuple([hostTabSchema]), (_event, tab) => storage.saveTab(tab, false));
  handle(IPC.tabDelete, z.tuple([z.string().min(1), z.boolean()]), (_event, id, deleteBackups) =>
    storage.deleteTab(id, deleteBackups),
  );
  handle(IPC.hostsImport, empty, () => hosts.read());
  handle(IPC.tabSaveAndApply, z.tuple([hostTabSchema]), async (_event, tab) => {
    const settings = await storage.getSettings();
    const saved = await storage.saveTab(tab, settings.autoBackupOnSave);
    await hosts.apply(await storage.listTabs());
    return saved;
  });
  handle(IPC.backupsList, empty, () => storage.listBackups());
  handle(IPC.backupsCreate, z.tuple([hostTabSchema, backupReasonSchema]), (_event, tab, reason) =>
    storage.createBackup(tab, reason),
  );
  handle(IPC.backupsRead, z.tuple([backupInfoSchema]), (_event, backup) =>
    storage.readBackup(backup),
  );
  handle(IPC.backupsRestore, z.tuple([backupInfoSchema]), (_event, backup) =>
    storage.restoreBackup(backup),
  );
  handle(IPC.backupsDelete, z.tuple([backupInfoSchema]), (_event, backup) =>
    storage.deleteBackup(backup),
  );
  handle(IPC.backupsExport, z.tuple([backupInfoSchema]), (_event, backup) =>
    storage.exportBackup(backup),
  );
  handle(IPC.backupsExportAll, empty, () => storage.exportAllBackups());
  handle(IPC.backupsImport, empty, () => storage.importBackups());
  handle(IPC.backupsOpen, empty, () => storage.openBackups());
  handle(IPC.settingsSave, z.tuple([settingsSchema]), async (_event, settings) => {
    await storage.saveSettings(settings);
    nativeTheme.themeSource = settings.theme;
    return settings;
  });
  handle(IPC.updateGetState, empty, () => updates.getState());
  handle(IPC.updateDownload, empty, () => updates.download());
  handle(IPC.updateInstall, empty, () => updates.install());
  handle(IPC.updateSafety, z.tuple([z.boolean(), z.boolean()]), (_event, dirty, busy) => {
    if (typeof dirty !== "boolean" || typeof busy !== "boolean")
      throw new Error("Invalid update safety state.");
    updates.setSafety(dirty, busy);
  });
  handle(IPC.updateCheck, empty, () => updates.check());
  handle(IPC.updateOpen, empty, () => updates.open());
  handle(IPC.fullscreen, z.tuple([z.boolean()]), (_event, value) =>
    BrowserWindow.getFocusedWindow()?.setFullScreen(value),
  );

  handle(IPC.feedbackCaptcha, empty, async () => {
    try {
      return { ok: true, captcha: await feedback.captcha() } as const;
    } catch (cause) {
      return {
        ok: false,
        message: cause instanceof Error ? cause.message : "CAPTCHA service is unavailable.",
      } as const;
    }
  });
  handle(IPC.feedbackSubmit, z.tuple([feedbackSubmissionSchema]), async (_event, payload) => {
    try {
      return { ok: true, result: await feedback.submit(payload) } as const;
    } catch (cause) {
      return {
        ok: false,
        message: cause instanceof Error ? cause.message : "The report could not be sent.",
      } as const;
    }
  });
  handle(IPC.externalOpen, z.tuple([z.string().max(2048)]), async (_event, url) => {
    const allowed = new URL(url);
    const isNurByte = allowed.protocol === "https:" && allowed.hostname === "nurbyte.dev";
    const isFeedbackEmail =
      allowed.protocol === "mailto:" && allowed.pathname === "rm.software.lab@gmail.com";
    if (!isNurByte && !isFeedbackEmail) {
      throw new Error("External URL is not allowed");
    }
    await shell.openExternal(allowed.toString());
  });
};
