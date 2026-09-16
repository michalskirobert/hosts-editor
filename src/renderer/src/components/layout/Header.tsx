import { ArchiveRestore, Import, RefreshCw, Save } from "lucide-react";

import { useHostsEditorContext } from "@renderer/context/useHostsEditorContext";
export const Header = () => {
  const { state, tab, dirtyIds, importIntoCurrent, createManualBackup, saveCurrent } =
    useHostsEditorContext();
  const dirty = tab ? dirtyIds.has(tab.id) : false;

  const title =
    state.page === "editor"
      ? (tab?.name ?? "Hosts")
      : state.page === "backups"
        ? "Backups"
        : "Settings";

  const subtitle =
    state.page === "editor"
      ? tab
        ? dirty
          ? "Unsaved changes"
          : "Saved"
        : "Create a tab or import your system hosts to begin"
      : state.page === "backups"
        ? "Automatic and manual snapshots for every tab"
        : "Appearance, fullscreen and updates";

  return (
    <header className="flex h-19 items-center justify-between border-b border-slate-200 bg-white/70 px-7 dark:border-white/8 dark:bg-[#090d14]/80">
      <div>
        <div className="text-lg font-semibold">{title}</div>
        <div className="text-xs text-slate-400">{subtitle}</div>
      </div>
      {state.page === "editor" && (
        <div className="flex items-center gap-2">
          {state.message && (
            <span className="max-w-72 truncate text-xs text-slate-500">{state.message}</span>
          )}
          <button
            onClick={() => {
              void importIntoCurrent();
            }}
            className="action"
          >
            <Import size={15} /> Import system hosts
          </button>
          {tab && (
            <button
              onClick={() => {
                void createManualBackup();
              }}
              className="action"
            >
              <ArchiveRestore size={15} /> Backup
            </button>
          )}
          <button
            onClick={() => {
              void saveCurrent();
            }}
            disabled={!tab || state.busy}
            className="primary"
          >
            {state.busy ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            Save
          </button>
        </div>
      )}
    </header>
  );
};
