import { serializeLines } from "../../../../shared/domain/hosts";
import { useHostsEditorContext } from "@renderer/context/useHostsEditorContext";
import { Modal } from "./Modal";
import { ModalActions } from "./ModalActions";

export const AppDialog = () => {
  const { state, patchState, confirmImport, confirmDeleteTab, deleteBackup, restoreBackup } =
    useHostsEditorContext();
  const dialog = state.dialog;

  if (dialog.kind === "none") return null;

  const close = (): void => {
    patchState({ dialog: { kind: "none" } });
  };

  if (dialog.kind === "preview") {
    return (
      <Modal title={`Backup · ${dialog.snapshot.tab.name}`} onClose={close}>
        <pre className="mono scroll max-h-[55vh] overflow-auto whitespace-pre-wrap rounded-xl bg-slate-950 p-4 text-xs text-slate-200">
          {serializeLines(dialog.snapshot.tab.lines)}
        </pre>
      </Modal>
    );
  }

  if (dialog.kind === "import") {
    return (
      <Modal title="Replace current tab?" onClose={close}>
        <p className="text-sm text-slate-500">
          Importing the system hosts file will replace the current contents of{" "}
          <strong>“{dialog.tab.name}”</strong>. Unsaved changes in this tab will be lost. A recovery
          backup will be created first.
        </p>
        <ModalActions
          cancel={close}
          confirm={() => {
            void confirmImport(dialog.tab);
          }}
          confirmLabel="Import and replace"
        />
      </Modal>
    );
  }

  if (dialog.kind === "restore") {
    return (
      <Modal title="Restore this backup?" onClose={close}>
        <p className="text-sm text-slate-500">
          The current saved state of this tab will be snapshotted before the backup is restored.
        </p>
        <ModalActions
          cancel={close}
          confirm={() => {
            void restoreBackup(dialog.backup);
          }}
          confirmLabel="Restore backup"
        />
      </Modal>
    );
  }

  if (dialog.kind === "delete-backup") {
    return (
      <Modal title="Delete backup?" onClose={close}>
        <p className="text-sm text-slate-500">This backup file will be permanently deleted.</p>
        <ModalActions
          cancel={close}
          confirm={() => {
            void deleteBackup(dialog.backup);
          }}
          confirmLabel="Delete"
          danger
        />
      </Modal>
    );
  }

  return (
    <Modal title={`Delete “${dialog.tab.name}”?`} onClose={close}>
      <p className="text-sm text-slate-500">
        The tab will be removed. Its backup history is kept by default.
      </p>
      <label className="mt-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={dialog.deleteBackups}
          onChange={(event) => {
            patchState({ dialog: { ...dialog, deleteBackups: event.target.checked } });
          }}
        />
        Also permanently delete this tab’s backups
      </label>
      <ModalActions
        cancel={close}
        confirm={() => {
          void confirmDeleteTab(dialog.tab, dialog.deleteBackups);
        }}
        confirmLabel="Delete tab"
        danger
      />
    </Modal>
  );
};
