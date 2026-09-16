import { useEffect, useMemo } from "react";

import { parseHostsText, serializeLines } from "../../../shared/domain/hosts";
import type { AppSettings, BackupInfo, EditorMode, HostLine, HostTab } from "../../../shared/types";
import { applyTheme } from "../lib/theme";
import { tabFingerprint } from "../lib/tabFingerprint";
import { useAppState } from "./useAppState";

export const useHostsEditor = () => {
  const { state, patchState, setTabs, patchTab, appendTab } = useAppState();
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
    void window.hostsEditor.bootstrap().then((payload) => {
      patchState({
        tabs: payload.tabs,
        saved: Object.fromEntries(payload.tabs.map((item) => [item.id, tabFingerprint(item)])),
        selected: payload.tabs[0]?.id ?? "",
        settings: payload.settings,
        hostsPath: payload.hostsPath,
        version: payload.version,
      });
      applyTheme(payload.settings.theme);
      if (payload.settings.checkForUpdates) {
        void window.hostsEditor.checkUpdate().then((update) => {
          patchState({ update });
        });
      }
    });
  }, [patchState]);

  useEffect(() => {
    if (tab) {
      patchState({ raw: serializeLines(tab.lines) });
    }
  }, [patchState, tab]);

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

  const saveCurrent = async (): Promise<void> => {
    const current = materializeCurrentTab();
    if (!current) return;
    patchState({ busy: true, message: "" });
    try {
      const result = await window.hostsEditor.saveTabAndApply(current);
      patchTab(result);
      patchState({
        raw: serializeLines(result.lines),
        saved: { ...state.saved, [result.id]: tabFingerprint(result) },
        message: `Saved “${result.name}” and updated system hosts`,
      });
    } catch (error: unknown) {
      patchState({
        message: `Save failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      patchState({ busy: false });
    }
  };

  const createTab = async (): Promise<void> => {
    const created = await window.hostsEditor.createTab("New tab", "");
    appendTab(created);
    patchState({
      saved: { ...state.saved, [created.id]: tabFingerprint(created) },
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
    patchState({ saved, selected: remaining[0]?.id ?? "", dialog: { kind: "none" } });
  };

  const loadBackups = async (): Promise<void> => {
    patchState({ backups: await window.hostsEditor.listBackups(), page: "backups" });
  };
  const createManualBackup = async (): Promise<void> => {
    const current = materializeCurrentTab();
    if (!current) return;
    await window.hostsEditor.createBackup(current, "manual");
    patchState({ message: "Manual backup created" });
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
      saved: { ...state.saved, [restored.id]: tabFingerprint(restored) },
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
    saveCurrent,
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
    saveSettings,
    deleteBackup,
    restoreBackup,
  };
};
