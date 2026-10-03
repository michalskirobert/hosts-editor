import {
  ArchiveRestore,
  Download,
  FileArchive,
  FolderOpen,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";

import { Button } from "@renderer/components/ui/Button";
import { IconButton } from "@renderer/components/ui/IconButton";
import { useHostsEditorContext } from "@renderer/context/useHostsEditorContext";

export const BackupsPage = () => {
  const { state, patchState, createManualBackup } = useHostsEditorContext();

  const refreshBackups = async (): Promise<void> => {
    patchState({ backups: await window.hostsEditor.listBackups() });
  };

  const importBackups = async (): Promise<void> => {
    try {
      const result = await window.hostsEditor.importBackups();
      if (!result) return;
      await refreshBackups();
      const skipped = result.skipped ? ` ${String(result.skipped)} duplicate(s) skipped.` : "";
      patchState({
        message: `Imported ${String(result.imported)} backup(s) from ${result.sourceName}.${skipped}`,
      });
    } catch (cause) {
      patchState({
        message:
          cause instanceof Error
            ? `Could not import backups: ${cause.message}`
            : "Could not import backups.",
      });
    }
  };

  const exportAll = async (): Promise<void> => {
    const exported = await window.hostsEditor.exportAllBackups();
    if (exported) patchState({ message: "Backup archive exported." });
  };

  return (
    <div className="mx-auto max-w-5xl py-5">
      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <Button
          onClick={() => {
            void importBackups();
          }}
          icon={<Upload size={16} />}
        >
          Import backup
        </Button>
        <Button
          onClick={() => {
            void exportAll();
          }}
          icon={<FileArchive size={16} />}
          disabled={!state.backups.length}
          disabledReason={!state.backups.length ? "Create or import a backup first" : undefined}
        >
          Export all
        </Button>
        <Button
          onClick={() => {
            void window.hostsEditor.openBackups();
          }}
          icon={<FolderOpen size={16} />}
        >
          Open folder
        </Button>
        <Button
          onClick={() => {
            void createManualBackup();
          }}
          disabled={state.busy}
          disabledReason={state.busy ? "Wait for the current operation to finish" : undefined}
          variant="primary"
          icon={state.busy ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
        >
          {state.busy ? "Creating backup..." : "Backup current tab"}
        </Button>
      </div>
      <div className="overflow-hidden rounded-3xl border border-slate-300/80 bg-white/82 shadow-[0_18px_60px_-34px_rgba(15,23,42,0.32)] backdrop-blur-3xl dark:border-white/[0.065] dark:bg-white/[0.03]">
        {state.backups.length ? (
          state.backups.map((backup) => (
            <div
              key={backup.path}
              className="group flex items-center gap-4 border-b border-slate-200/80 px-5 py-4 transition-colors duration-300 hover:bg-amber-50/80 dark:border-white/[0.045] dark:hover:bg-amber-300/[0.035]"
            >
              <ArchiveRestore size={18} className="text-slate-600 dark:text-slate-300" />
              <div className="min-w-0 flex-1">
                <div className="font-medium text-slate-900 dark:text-slate-100">
                  {state.tabs.find((tab) => tab.id === backup.tabId)?.name ?? backup.tabId}
                </div>
                <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {backup.reason} · {backup.fileName}
                </div>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {new Date(backup.createdAt).toLocaleString()}
              </span>
              <Button
                onClick={() => {
                  void window.hostsEditor.readBackup(backup).then((snapshot) => {
                    patchState({ dialog: { kind: "preview", snapshot } });
                  });
                }}
              >
                Preview
              </Button>
              <IconButton
                label="Export"
                onClick={() => {
                  void window.hostsEditor.exportBackup(backup);
                }}
              >
                <Download size={15} />
              </IconButton>
              <Button
                onClick={() => {
                  patchState({ dialog: { kind: "restore", backup } });
                }}
              >
                Restore
              </Button>
              <IconButton
                label="Delete"
                danger
                onClick={() => {
                  patchState({ dialog: { kind: "delete-backup", backup } });
                }}
              >
                <Trash2 size={15} />
              </IconButton>
            </div>
          ))
        ) : (
          <div className="p-16 text-center text-slate-500 dark:text-slate-400">
            No backups yet. Create one or import a Hosts Editor JSON/ZIP backup.
          </div>
        )}
      </div>
    </div>
  );
};
