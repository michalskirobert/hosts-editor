import { useEffect, useMemo, useRef } from "react";

import { getHostLineError, parseHostsText, serializeLines } from "../../../shared/domain/hosts";
import type { AppSettings, BackupInfo, EditorMode, HostLine, HostTab } from "../../../shared/types";
import { applyTheme } from "../lib/theme";
import { tabFingerprint } from "../lib/tabFingerprint";
import { useAppState } from "./useAppState";

export const useHostsEditor = () => {
  const { state, patchState, setTabs, patchTab, appendTab } = useAppState();
  const bootstrapped = useRef(false);
  const installing = useRef(false);
  const saveQueue = useRef<Promise<unknown>>(Promise.resolve());
  const tab = useMemo(
    () => state.tabs.find((item) => item.id === state.selected),
    [state.tabs, state.selected],
  );
  const dirtyIds = useMemo(
    () =>
      new Set(
        state.tabs
          .filter((item) => state.saved[item.id] !== tabFingerprint(item))
          .map((item) => item.id),
      ),
    [state.tabs, state.saved],
  );

  useEffect(() => {
    const unsubscribe = window.hostsEditor.onUpdateState((update) => {
      patchState({ update });
    });
    void window.hostsEditor
      .getUpdateState()
      .then((update) => {
        patchState({ update });
      })
      .catch(() => undefined);
    if (!bootstrapped.current) {
      bootstrapped.current = true;
      patchState({ busy: true });
      void window.hostsEditor
        .bootstrap()
        .then((payload) => {
          patchState({
            tabs: payload.tabs,
            saved: Object.fromEntries(payload.tabs.map((item) => [item.id, tabFingerprint(item)])),
            savedTabs: Object.fromEntries(payload.tabs.map((item) => [item.id, item])),
            selected: payload.tabs[0]?.id ?? "",
            settings: payload.settings,
            hostsPath: payload.hostsPath,
            version: payload.version,
            busy: false,
          });
          applyTheme(payload.settings.theme);
        })
        .catch((error: unknown) => {
          patchState({
            busy: false,
            message: `Startup failed: ${error instanceof Error ? error.message : String(error)}`,
          });
        });
    }
    return unsubscribe;
  }, [patchState]);

  useEffect(() => {
    void window.hostsEditor
      .setUpdateSafety(dirtyIds.size > 0, state.busy || !state.version)
      .catch(() => undefined);
  }, [dirtyIds, state.busy, state.version]);

  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const refresh = (): void => {
      if (state.settings.theme === "system") applyTheme("system");
    };
    media.addEventListener("change", refresh);
    return () => {
      media.removeEventListener("change", refresh);
    };
  }, [state.settings.theme]);

  useEffect(() => {
    if (tab) {
      patchState({ raw: serializeLines(tab.lines) });
    }
  }, [patchState, tab]);

  useEffect(() => {
    if (state.tabs.length === 0 || state.busy || installing.current) return;
    const timeout = window.setTimeout(() => {
      saveQueue.current = saveQueue.current
        .catch(() => undefined)
        .then(() => Promise.all(state.tabs.map((item) => window.hostsEditor.saveTab(item))));
      void saveQueue.current.catch((error: unknown) => {
        patchState({
          message: `JSON auto-save failed: ${error instanceof Error ? error.message : String(error)}`,
        });
      });
    }, 350);
    return () => {
      window.clearTimeout(timeout);
    };
  }, [patchState, state.tabs, state.busy]);

  const setLines = (lines: readonly HostLine[]): void => {
    if (tab) patchTab({ ...tab, lines });
  };

  const switchMode = (mode: EditorMode): void => {
    if (!tab) return;
    if (state.mode === "raw" && mode === "structured") setLines(parseHostsText(state.raw));
    if (state.mode === "structured" && mode === "raw")
      patchState({ raw: serializeLines(tab.lines) });
    patchState({ mode });
  };

  const materializeCurrentTab = (): HostTab | undefined => {
    if (!tab) return undefined;
    return state.mode === "raw" ? { ...tab, lines: parseHostsText(state.raw) } : tab;
  };

  const saveCurrent = async (): Promise<boolean> => {
    const current = materializeCurrentTab();
    if (!current) return true;

    const invalid = current.lines.find((line) => getHostLineError(line));
    if (invalid) {
      patchState({ message: getHostLineError(invalid) ?? "Invalid hosts entry" });
      return false;
    }

    patchState({ busy: true, message: "" });
    try {
      await saveQueue.current;
      await Promise.all(
        state.tabs
          .filter((item) => item.id !== current.id)
          .map((item) => window.hostsEditor.saveTab(item)),
      );
      const result = await window.hostsEditor.saveTabAndApply(current);
      patchTab(result);
      const appliedTabs = state.tabs.map((item) => (item.id === result.id ? result : item));
      patchState({
        raw: serializeLines(result.lines),
        saved: Object.fromEntries(appliedTabs.map((item) => [item.id, tabFingerprint(item)])),
        savedTabs: Object.fromEntries(appliedTabs.map((item) => [item.id, item])),
        message: `Saved “${result.name}” and updated system hosts`,
      });
      return true;
    } catch (error: unknown) {
      patchState({
        message: `Save failed: ${error instanceof Error ? error.message : String(error)}`,
      });
      return false;
    } finally {
      patchState({ busy: false });
    }
  };

  const installUpdate = async (discard: boolean): Promise<void> => {
    if (installing.current || state.busy) return;
    installing.current = true;
    patchState({ busy: true });
    try {
      await saveQueue.current;
      if (dirtyIds.size > 0) {
        if (discard) {
          const restored = state.tabs.map((item) =>
            dirtyIds.has(item.id) ? (state.savedTabs[item.id] ?? item) : item,
          );
          await Promise.all(restored.map((item) => window.hostsEditor.saveTab(item)));
          setTabs(restored);
          patchState({
            raw: serializeLines(restored.find((item) => item.id === state.selected)?.lines ?? []),
          });
        } else if (!(await saveCurrent())) return;
      } else {
        await Promise.all(state.tabs.map((item) => window.hostsEditor.saveTab(item)));
      }
      await window.hostsEditor.setUpdateSafety(false, false);
      await window.hostsEditor.installUpdate();
    } catch (error: unknown) {
      patchState({
        message: `Update installation failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      installing.current = false;
      patchState({ busy: false });
    }
  };

  const addHosts = async (lines: readonly HostLine[], saveNow: boolean): Promise<void> => {
    const current = materializeCurrentTab();
    if (!current || lines.length === 0) return;

    const updated: HostTab = { ...current, lines: [...current.lines, ...lines] };
    const normalizedQuery = state.query.trim().toLowerCase();
    const hiddenBySearch =
      normalizedQuery.length > 0 &&
      lines.some(
        (line) =>
          !`${line.address} ${line.hostname} ${line.comment}`
            .toLowerCase()
            .includes(normalizedQuery),
      );

    if (!saveNow) {
      patchTab(updated);
      patchState({
        raw: serializeLines(updated.lines),
        mode: "structured",
        dialog: { kind: "none" },
        message: hiddenBySearch
          ? `${String(lines.length)} ${lines.length === 1 ? "host" : "hosts"} added. Some new entries are hidden by the current search filter.`
          : `${String(lines.length)} ${lines.length === 1 ? "host" : "hosts"} added. Save when ready.`,
      });
      return;
    }

    patchState({ busy: true, message: "" });
    try {
      await saveQueue.current;
      await Promise.all(
        state.tabs
          .filter((item) => item.id !== updated.id)
          .map((item) => window.hostsEditor.saveTab(item)),
      );
      const result = await window.hostsEditor.saveTabAndApply(updated);
      patchTab(result);
      const appliedTabs = state.tabs.map((item) => (item.id === result.id ? result : item));
      patchState({
        raw: serializeLines(result.lines),
        mode: "structured",
        dialog: { kind: "none" },
        saved: Object.fromEntries(appliedTabs.map((item) => [item.id, tabFingerprint(item)])),
        savedTabs: Object.fromEntries(appliedTabs.map((item) => [item.id, item])),
        message: hiddenBySearch
          ? `${String(lines.length)} ${lines.length === 1 ? "host" : "hosts"} added and saved. Some new entries are hidden by the current search filter.`
          : `${String(lines.length)} ${lines.length === 1 ? "host" : "hosts"} added and system hosts updated.`,
      });
    } catch (error: unknown) {
      patchState({
        message: `Save failed: ${error instanceof Error ? error.message : String(error)}`,
      });
      throw error;
    } finally {
      patchState({ busy: false });
    }
  };

  const createTab = async (): Promise<void> => {
    const created = await window.hostsEditor.createTab("New tab", "");
    appendTab(created);
    patchState({
      saved: { ...state.saved, [created.id]: tabFingerprint(created) },
      savedTabs: { ...state.savedTabs, [created.id]: created },
      selected: created.id,
      page: "editor",
      renamingId: created.id,
      renameValue: created.name,
    });
  };

  const startRename = (target: HostTab): void => {
    patchState({ renamingId: target.id, renameValue: target.name });
  };
  const cancelRename = (): void => {
    patchState({ renamingId: undefined, renameValue: "" });
  };
  const commitRename = (): void => {
    const current = state.tabs.find((item) => item.id === state.renamingId);
    if (current) patchTab({ ...current, name: state.renameValue.trim() || "Untitled tab" });
    cancelRename();
  };

  const selectTab = (id: string): void => {
    patchState({ selected: id, page: "editor" });
  };
  const importIntoCurrent = async (): Promise<void> => {
    if (tab) {
      patchState({ dialog: { kind: "import", tab } });
      return;
    }
    const text = await window.hostsEditor.importHosts();
    const created = await window.hostsEditor.createTab("Imported hosts", text);
    appendTab(created);
    patchState({
      saved: { ...state.saved, [created.id]: tabFingerprint(created) },
      savedTabs: { ...state.savedTabs, [created.id]: created },
      selected: created.id,
      page: "editor",
    });
  };

  const confirmImport = async (target: HostTab): Promise<void> => {
    patchState({ dialog: { kind: "none" }, busy: true });
    try {
      await window.hostsEditor.createBackup(target, "pre-import");
      const text = await window.hostsEditor.importHosts();
      patchTab({ ...target, lines: parseHostsText(text) });
      patchState({
        raw: text,
        mode: "raw",
        message: "System hosts imported into the current tab. Save when ready.",
      });
    } finally {
      patchState({ busy: false });
    }
  };

  const confirmDeleteTab = async (target: HostTab, deleteBackups: boolean): Promise<void> => {
    await window.hostsEditor.deleteTab(target.id, deleteBackups);
    const remaining = state.tabs.filter((item) => item.id !== target.id);
    setTabs(remaining);
    const saved = Object.entries(state.saved).reduce<Record<string, string>>(
      (result, [id, fingerprint]) => {
        if (id !== target.id) result[id] = fingerprint;
        return result;
      },
      {},
    );
    const savedTabs = Object.entries(state.savedTabs).reduce<Record<string, HostTab>>(
      (result, [id, savedTab]) => {
        if (id !== target.id) result[id] = savedTab;
        return result;
      },
      {},
    );
    patchState({ saved, savedTabs, selected: remaining[0]?.id ?? "", dialog: { kind: "none" } });
  };

  const requestDiscardChanges = (): void => {
    if (!tab || !dirtyIds.has(tab.id)) return;
    patchState({ dialog: { kind: "discard-changes", tab } });
  };

  const confirmDiscardChanges = (target: HostTab): void => {
    const savedTab = state.savedTabs[target.id];
    if (!savedTab) {
      patchState({ dialog: { kind: "none" }, message: "The last saved state is not available." });
      return;
    }

    const restoredTab = { ...savedTab, name: target.name };
    patchTab(restoredTab);
    patchState({
      raw: serializeLines(restoredTab.lines),
      dialog: { kind: "none" },
      message: `Discarded unsaved changes in “${savedTab.name}”`,
    });
  };

  const loadBackups = async (): Promise<void> => {
    patchState({ backups: await window.hostsEditor.listBackups(), page: "backups" });
  };
  const createManualBackup = async (): Promise<void> => {
    const current = materializeCurrentTab();
    if (!current || state.busy) return;

    patchState({ busy: true, message: "" });
    try {
      await window.hostsEditor.createBackup(current, "manual");
      const backups = await window.hostsEditor.listBackups();
      patchState({ backups, message: "Manual backup created" });
    } catch (error: unknown) {
      patchState({
        message: `Backup failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      patchState({ busy: false });
    }
  };
  const saveSettings = async (settings: AppSettings): Promise<void> => {
    patchState({ settings });
    applyTheme(settings.theme);
    await window.hostsEditor.saveSettings(settings);
  };
  const deleteBackup = async (backup: BackupInfo): Promise<void> => {
    await window.hostsEditor.deleteBackup(backup);
    patchState({ dialog: { kind: "none" }, backups: await window.hostsEditor.listBackups() });
  };
  const restoreBackup = async (backup: BackupInfo): Promise<void> => {
    const restored = await window.hostsEditor.restoreBackup(backup);
    const tabs = state.tabs.some((item) => item.id === restored.id)
      ? state.tabs.map((item) => (item.id === restored.id ? restored : item))
      : [...state.tabs, restored];
    patchState({
      tabs,
      selected: restored.id,
      raw: serializeLines(restored.lines),
      dialog: { kind: "none" },
      page: "editor",
    });
  };

  return {
    state,
    tab,
    dirtyIds,
    patchState,
    setLines,
    switchMode,
    saveCurrent: async (): Promise<void> => {
      await saveCurrent();
    },
    installUpdate,
    addHosts,
    createTab,
    startRename,
    cancelRename,
    commitRename,
    selectTab,
    importIntoCurrent,
    confirmImport,
    confirmDeleteTab,
    loadBackups,
    createManualBackup,
    requestDiscardChanges,
    confirmDiscardChanges,
    saveSettings,
    deleteBackup,
    restoreBackup,
  };
};
