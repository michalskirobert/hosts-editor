import { Moon, Settings, Sun } from "lucide-react";

import { Panel } from "../../components/ui/Panel";
import { useHostsEditorContext } from "@renderer/context/useHostsEditorContext";
export const SettingsPage = () => {
  const { state, patchState, saveSettings } = useHostsEditorContext();

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
      <Panel title="Updates">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Version {state.version}</div>
            <div className="text-sm text-slate-400">
              {state.update.message ??
                (state.update.status === "available"
                  ? `Version ${state.update.version ?? "new"} is available.`
                  : "Check GitHub Releases for updates.")}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                void window.hostsEditor.checkUpdate().then((update) => {
                  patchState({ update });
                });
              }}
              className="action"
            >
              Check
            </button>
            {state.update.status === "available" && (
              <button
                onClick={() => {
                  void window.hostsEditor.openUpdate();
                }}
                className="primary"
              >
                Download
              </button>
            )}
          </div>
        </div>
      </Panel>
    </div>
  );
};
