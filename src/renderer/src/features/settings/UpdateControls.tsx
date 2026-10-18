import { Download, FolderOpen, PackageOpen, RefreshCw, RotateCw, X } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";

import { useHostsEditorContext } from "../../context/useHostsEditorContext";
import { Button } from "../../components/ui/Button";
import { Toggle } from "../../components/shared/form";
import { Modal } from "../../components/ui/Modal";

const bytes = (value: number): string => `${(value / 1024 / 1024).toFixed(1)} MB`;

export const UpdateControls = () => {
  const { state, dirtyIds, installUpdate, saveSettings } = useHostsEditorContext();
  const [confirm, setConfirm] = useState<"none" | "ready" | "unsaved">("none");
  const [actionError, setActionError] = useState("");
  const mounted = useRef(true);
  useLayoutEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const update = state.update;
  const working = ["checking", "downloading", "opening", "handoff", "installing"].includes(
    update.status,
  );
  const canDownload =
    ["available", "cancelled", "error"].includes(update.status) &&
    Boolean(update.version && update.packageType);
  const run = (operation: () => Promise<unknown>): void => {
    setActionError("");
    void Promise.resolve()
      .then(operation)
      .catch((error: unknown) => {
        if (mounted.current)
          setActionError(error instanceof Error ? error.message : "The update action failed.");
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
      <div className="rounded-2xl border border-slate-200/80 bg-white/55 p-4 dark:border-white/10 dark:bg-white/[0.025]">
        <div className="text-xs text-slate-600 dark:text-slate-400">
          Installed: <strong className="text-slate-900 dark:text-slate-100">{state.version}</strong>
        </div>
        <p
          role={update.status === "error" ? "alert" : "status"}
          className={`mt-2 min-h-5 text-sm ${update.status === "error" ? "text-red-600 dark:text-red-300" : update.status === "current" ? "text-emerald-700 dark:text-emerald-400" : "text-slate-800 dark:text-slate-200"}`}
        >
          {update.message ?? "Check for the latest Hosts Editor version."}
        </p>
        {update.status === "downloading" && (
          <div className="mt-4">
            <progress
              aria-label="Update download progress"
              max={100}
              value={update.progress?.percent ?? 0}
              className="block h-2 w-full accent-amber-500"
            />
            <p className="mt-2 text-xs tabular-nums text-slate-600 dark:text-slate-400">
              {update.progress
                ? `${update.progress.percent.toFixed(1)}% · ${bytes(update.progress.transferred)}${update.progress.total > 0 ? ` / ${bytes(update.progress.total)}` : ""}`
                : "Connecting…"}
            </p>
          </div>
        )}
      </div>
      <div className="flex min-h-10 flex-wrap items-center gap-2">
        <Button
          className="h-10"
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
        {canDownload && (
          <Button
            className="h-10"
            variant="primary"
            icon={<Download size={15} />}
            onClick={() => {
              run(() => window.hostsEditor.downloadUpdate());
            }}
          >
            {update.status === "error" ? "Retry download" : "Download Update"}
          </Button>
        )}
        {update.status === "downloading" && (
          <Button
            className="h-10"
            icon={<X size={15} />}
            onClick={() => {
              run(() => window.hostsEditor.cancelUpdate());
            }}
          >
            Cancel download
          </Button>
        )}
        {update.status === "downloaded" &&
          (update.installSupported || update.handoffSupported ? (
            <Button
              className="h-10"
              variant="primary"
              disabled={state.busy}
              icon={<RotateCw size={15} />}
              onClick={() => {
                if (update.handoffSupported) setConfirm("ready");
                else if (dirtyIds.size) setConfirm("unsaved");
                else run(() => installUpdate(false));
              }}
            >
              {update.handoffSupported ? "Install Update" : "Restart & Install"}
            </Button>
          ) : (
            <>
              <Button
                className="h-10"
                variant="primary"
                icon={<PackageOpen size={15} />}
                onClick={() => {
                  run(() => window.hostsEditor.openUpdate());
                }}
              >
                {update.packageType === "AppImage"
                  ? "Open downloaded app"
                  : update.packageType === "zip"
                    ? "Open downloaded archive"
                    : "Open Installer"}
              </Button>
              <Button
                className="h-10"
                icon={<FolderOpen size={15} />}
                onClick={() => {
                  run(() => window.hostsEditor.showUpdateInFolder());
                }}
              >
                Show in Folder
              </Button>
            </>
          ))}
        {update.status === "downloaded" && update.handoffSupported && (
          <Button
            className="h-10"
            icon={<FolderOpen size={15} />}
            disabled={state.busy}
            onClick={() => {
              run(() => window.hostsEditor.showUpdateInFolder());
            }}
          >
            Show in Folder
          </Button>
        )}
      </div>
      {actionError && (
        <p
          role="alert"
          className="rounded-xl border border-red-400/25 bg-red-500/5 p-3 text-sm text-red-700 dark:text-red-300"
        >
          {actionError}
        </p>
      )}
      {confirm === "ready" && (
        <Modal
          title="Ready to Install"
          onClose={() => {
            if (!state.busy) setConfirm("none");
          }}
        >
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Hosts Editor needs to close before installing the update. The installer will open
            automatically.
          </p>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            After Hosts Editor closes, replace Hosts Editor.app in Applications using the opened
            installer.
          </p>
          {state.message && /failed|could not/i.test(state.message) && (
            <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-300">
              {state.message}
            </p>
          )}
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Button
              disabled={state.busy}
              onClick={() => {
                setConfirm("none");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={state.busy || working}
              onClick={() => {
                if (dirtyIds.size) setConfirm("unsaved");
                else run(() => installUpdate(false));
              }}
            >
              Quit &amp; Open Installer
            </Button>
          </div>
        </Modal>
      )}
      {confirm === "unsaved" && (
        <Modal
          title="Unsaved changes before restart"
          onClose={() => {
            if (!state.busy) setConfirm("none");
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
                setConfirm("none");
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
