import { Bug, Download, Moon, RefreshCw, Settings, Sun } from "lucide-react";

import { Panel } from "../../components/ui/Panel";
import { useHostsEditorContext } from "@renderer/context/useHostsEditorContext";

export const SettingsPage = () => {
  const { state, patchState, saveSettings } = useHostsEditorContext();

  const checkForUpdate = async (): Promise<void> => {
    patchState({ update: { status: "checking" } });
    const update = await window.hostsEditor.checkUpdate();
    patchState({ update, message: update.message ?? "" });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 py-5">
      <Panel title="Appearance">
        <div className="grid grid-cols-3 gap-3">
          {(["system", "light", "dark"] as const).map((theme) => (
            <button
              key={theme}
              onClick={() => {
                void saveSettings({ ...state.settings, theme });
              }}
              className={`rounded-xl border p-4 text-left ${state.settings.theme === theme ? "border-slate-900 dark:border-white" : "border-slate-200 dark:border-white/10"}`}
            >
              {theme === "light" ? <Sun /> : theme === "dark" ? <Moon /> : <Settings />}
              <div className="mt-3 capitalize">{theme}</div>
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="Window">
        <label className="flex items-center justify-between">
          <span>Fullscreen</span>
          <input
            type="checkbox"
            checked={state.settings.fullscreen}
            onChange={(event) => {
              const fullscreen = event.target.checked;
              void saveSettings({ ...state.settings, fullscreen });
              void window.hostsEditor.setFullscreen(fullscreen);
            }}
          />
        </label>
      </Panel>

      <Panel title="Backups">
        <label className="flex items-center justify-between gap-6">
          <div>
            <div className="font-medium">Automatic backup on Save</div>
            <div className="mt-1 text-sm text-slate-400">
              Disabled by default. When enabled, the previous tab state is backed up before every
              Save. Manual backups are always available from the editor and Backups page.
            </div>
          </div>
          <input
            type="checkbox"
            checked={state.settings.autoBackupOnSave}
            onChange={(event) => {
              void saveSettings({ ...state.settings, autoBackupOnSave: event.target.checked });
            }}
          />
        </label>
      </Panel>

      <Panel title="Updates">
        <div className="flex items-center justify-between gap-5">
          <div>
            <div className="font-medium">Version {state.version}</div>
            <div className="mt-1 text-sm text-slate-400">
              {state.update.status === "available"
                ? `Version ${state.update.version ?? "new"} is available. Please update Hosts Editor to get the latest fixes and improvements.`
                : (state.update.message ?? "Hosts Editor checks GitHub Releases for new versions.")}
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => {
                void checkForUpdate();
              }}
              disabled={state.update.status === "checking"}
              className="action"
            >
              <RefreshCw
                size={15}
                className={state.update.status === "checking" ? "animate-spin" : undefined}
              />
              {state.update.status === "checking" ? "Checking..." : "Check for updates"}
            </button>
            {state.update.status === "available" && (
              <button
                onClick={() => {
                  void window.hostsEditor.openUpdate();
                }}
                className="primary"
              >
                <Download size={15} /> Download
              </button>
            )}
          </div>
        </div>
      </Panel>

      <Panel title="Report a bug">
        <div className="flex gap-3">
          <Bug className="mt-0.5 shrink-0" size={19} />
          <div className="text-sm text-slate-500 dark:text-slate-400">
            <div>
              If you find a bug, please email <strong>rm.software.lab@gmail.com</strong>.
            </div>
            <div className="mt-2">
              Subject: <strong>#BUG short description</strong>
            </div>
            <div className="mt-1">
              In the message, describe exactly what happened, what you expected, and the steps
              needed to reproduce the problem. Please include your operating system and Hosts Editor
              version when possible.
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
};
