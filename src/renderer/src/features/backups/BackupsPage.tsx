import { ArchiveRestore, Download, FolderOpen, Plus, Trash2 } from "lucide-react";

import { useHostsEditorContext } from "@renderer/context/useHostsEditorContext";
export const BackupsPage = () => {
  const { state, patchState, createManualBackup } = useHostsEditorContext();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex justify-end gap-2">
        <button
          onClick={() => {
            void window.hostsEditor.openBackups();
          }}
          className="action"
        >
          <FolderOpen size={16} /> Open folder
        </button>
        <button
          onClick={() => {
            void createManualBackup();
          }}
          className="primary"
        >
          <Plus size={16} /> Backup current tab
        </button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#0f1622]">
        {state.backups.length ? (
          state.backups.map((backup) => (
            <div
              key={backup.path}
              className="flex items-center gap-4 border-b border-slate-100 px-5 py-4 dark:border-white/6"
            >
              <ArchiveRestore size={18} />
              <div className="min-w-0 flex-1">
                <div className="font-medium">
                  {state.tabs.find((tab) => tab.id === backup.tabId)?.name ?? backup.tabId}
                </div>
                <div className="truncate text-xs text-slate-400">
                  {backup.reason} · {backup.fileName}
                </div>
              </div>
              <span className="text-xs text-slate-400">
                {new Date(backup.createdAt).toLocaleString()}
              </span>
              <button
                onClick={() => {
                  void window.hostsEditor.readBackup(backup).then((snapshot) => {
                    patchState({ dialog: { kind: "preview", snapshot } });
                  });
                }}
                className="action"
              >
                Preview
              </button>
              <button
                onClick={() => {
                  void window.hostsEditor.exportBackup(backup);
                }}
                title="Export"
                className="icon"
              >
                <Download size={15} />
              </button>
              <button
                onClick={() => {
                  patchState({ dialog: { kind: "restore", backup } });
                }}
                className="action"
              >
                Restore
              </button>
              <button
                onClick={() => {
                  patchState({ dialog: { kind: "delete-backup", backup } });
                }}
                title="Delete"
                className="icon text-red-500"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))
        ) : (
          <div className="p-16 text-center text-slate-400">No backups yet.</div>
        )}
      </div>
    </div>
  );
};
