import { ArchiveRestore, Import, RefreshCw, Save, Undo2 } from "lucide-react";

import { Button } from "@renderer/components/ui/Button";
import { useHostsEditorContext } from "@renderer/context/useHostsEditorContext";

export const Header = () => {
  const {
    state,
    tab,
    dirtyIds,
    importIntoCurrent,
    createManualBackup,
    requestDiscardChanges,
    saveCurrent,
  } = useHostsEditorContext();
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
          : "System hosts up to date"
        : "Create a tab or import your system hosts to begin"
      : state.page === "backups"
        ? "Manual snapshots and restore points"
        : "Appearance, backups, updates and support";

  return (
    <header className="relative flex h-19 items-center justify-between border-b border-slate-300/60 bg-white/52 px-7 shadow-[0_1px_0_rgba(255,255,255,0.5)] backdrop-blur-2xl backdrop-saturate-150 dark:border-white/[0.07] dark:bg-slate-950/24 dark:shadow-none">
      <div>
        <div className="text-lg font-semibold tracking-[-0.02em]">{title}</div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          {state.page === "editor" && tab && (
            <span
              className={`h-1.5 w-1.5 rounded-full ${dirty ? "bg-amber-400" : "bg-emerald-400"}`}
            />
          )}
          {subtitle}
        </div>
      </div>
      {state.page === "editor" && (
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              void importIntoCurrent();
            }}
            icon={<Import size={16} />}
          >
            Import system hosts
          </Button>
          {tab && (
            <Button
              onClick={() => {
                void createManualBackup();
              }}
              icon={<ArchiveRestore size={16} />}
            >
              Backup
            </Button>
          )}
          <Button
            onClick={requestDiscardChanges}
            disabled={!tab || state.busy || !dirty}
            disabledReason={
              !tab
                ? "Select or create a tab first"
                : state.busy
                  ? "Another operation is currently running"
                  : !dirty
                    ? "No unsaved changes to discard"
                    : undefined
            }
            icon={<Undo2 size={16} />}
          >
            Discard changes
          </Button>
          <Button
            onClick={() => {
              void saveCurrent();
            }}
            disabled={!tab || state.busy || !dirty}
            disabledReason={
              !tab
                ? "Select or create a tab first"
                : state.busy
                  ? "Another operation is currently running"
                  : !dirty
                    ? "No unsaved changes"
                    : undefined
            }
            variant="primary"
            icon={
              state.busy ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />
            }
          >
            {state.busy ? "Saving…" : "Save changes"}
          </Button>
        </div>
      )}
    </header>
  );
};
