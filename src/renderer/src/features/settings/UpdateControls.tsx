import { Download, RefreshCw, RotateCw } from "lucide-react";
import { useState } from "react";

import { useHostsEditorContext } from "../../context/useHostsEditorContext";
import { Button } from "../../components/ui/Button";
import { Toggle } from "../../components/shared/form";
import { Modal } from "../../components/ui/Modal";

const bytes = (value: number): string => `${(value / 1024 / 1024).toFixed(1)} MB`;

export const UpdateControls = () => {
  const { state, dirtyIds, patchState, installUpdate, saveSettings } = useHostsEditorContext();
  const [confirm, setConfirm] = useState(false);
  const update = state.update;
  const working = ["checking", "downloading", "installing"].includes(update.status);
  const run = (operation: () => Promise<unknown>): void => {
    void operation().catch((error: unknown) => {
      patchState({
        message: `Update failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    });
  };
  return (
    <div className="space-y-4">
      <label className="flex items-center justify-between gap-4 text-sm">
        <span>Check for updates at startup</span>
        <Toggle
          label="Check for updates at startup"
          checked={state.settings.checkForUpdates}
          onChange={(checkForUpdates) => {
            run(() => saveSettings({ ...state.settings, checkForUpdates }));
          }}
        />
      </label>
      <div className="text-sm text-slate-700 dark:text-slate-200" role="status">
        Installed: <strong>{state.version}</strong>
        {update.version && update.status !== "current" ? (
          <>
            {" "}
            · Available: <strong>{update.version}</strong>
          </>
        ) : null}
        <p className="mt-2">{update.message ?? "Check GitHub Releases for new versions."}</p>
      </div>
      {update.limitation && (
        <p className="rounded-xl border border-orange-400/25 bg-orange-400/10 p-3 text-sm text-orange-900 dark:text-orange-200">
          {update.limitation}
        </p>
      )}
      {update.status === "downloading" && (
        <div>
          <progress
            aria-label="Update download progress"
            max={100}
            value={update.progress?.percent ?? 0}
            className="h-2 w-full accent-amber-500"
          />
          <p className="mt-1 text-xs tabular-nums text-slate-600 dark:text-slate-400">
            {update.progress
              ? `${update.progress.percent.toFixed(1)}% · ${bytes(update.progress.transferred)}${update.progress.total ? ` / ${bytes(update.progress.total)}` : ""}`
              : "Connecting…"}
          </p>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={working || update.status === "downloaded"}
          icon={
            <RefreshCw
              size={15}
              className={
                update.status === "checking" ? "animate-spin motion-reduce:animate-none" : ""
              }
            />
          }
          onClick={() => {
            run(() => window.hostsEditor.checkUpdate());
          }}
        >
          {update.status === "checking" ? "Checking…" : "Check for updates"}
        </Button>
        {update.status === "available" && (
          <Button
            variant="primary"
            icon={<Download size={15} />}
            onClick={() => {
              run(() =>
                update.installSupported
                  ? window.hostsEditor.downloadUpdate()
                  : window.hostsEditor.openUpdate(),
              );
            }}
          >
            {update.installSupported ? "Download update" : "Download manually"}
          </Button>
        )}
        {update.status === "error" && (
          <Button
            onClick={() => {
              run(() => window.hostsEditor.openUpdate());
            }}
          >
            Open release downloads
          </Button>
        )}
        {update.status === "downloaded" && (
          <Button
            variant="primary"
            disabled={state.busy}
            icon={<RotateCw size={15} />}
            onClick={() => {
              if (dirtyIds.size) setConfirm(true);
              else run(() => installUpdate(false));
            }}
          >
            Restart & Install
          </Button>
        )}
      </div>
      {confirm && (
        <Modal
          title="Unsaved changes before restart"
          onClose={() => {
            if (!state.busy) setConfirm(false);
          }}
        >
          <p className="text-sm text-slate-600 dark:text-slate-300">
            There are changes in {dirtyIds.size} tab(s). Save to system hosts or discard these
            changes before installing. Cancel to keep working.
          </p>
          {state.message && /failed|invalid|unrecognized/i.test(state.message) && (
            <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-300">
              {state.message}
            </p>
          )}
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Button
              disabled={state.busy}
              onClick={() => {
                setConfirm(false);
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={state.busy}
              variant="danger"
              onClick={() => {
                run(() => installUpdate(true));
              }}
            >
              Discard & Install
            </Button>
            <Button
              disabled={state.busy}
              variant="primary"
              onClick={() => {
                run(() => installUpdate(false));
              }}
            >
              {state.busy ? "Saving…" : "Save & Install"}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};
