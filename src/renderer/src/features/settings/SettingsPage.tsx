import { Check, Download, MessageSquareText, Moon, RefreshCw, Settings, Sun } from "lucide-react";
import { useState } from "react";

import { Button } from "../../components/ui/Button";
import { Panel } from "../../components/ui/Panel";
import { Toggle } from "../../components/shared/form";
import { cn } from "@renderer/lib/cn";
import { useHostsEditorContext } from "@renderer/context/useHostsEditorContext";
import { FeedbackDialog } from "@renderer/features/feedback/FeedbackDialog";

const themes = [
  { id: "system", label: "System", icon: Settings },
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
] as const;

export const SettingsPage = () => {
  const { state, patchState, saveSettings } = useHostsEditorContext();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const checkForUpdate = async (): Promise<void> => {
    patchState({ update: { status: "checking" } });
    const update = await window.hostsEditor.checkUpdate();
    patchState({ update, message: update.message ?? "" });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 py-5">
      <Panel title="Appearance">
        <div className="grid grid-cols-3 gap-3">
          {themes.map(({ id, label, icon: Icon }) => {
            const active = state.settings.theme === id;
            return (
              <button
                key={id}
                onClick={() => {
                  void saveSettings({ ...state.settings, theme: id });
                }}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border p-4 text-left transition-[background-color,border-color,box-shadow,transform] duration-300 ease-out motion-safe:hover:-translate-y-0.5 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40",
                  active
                    ? "-translate-y-0.5 border-amber-400/45 bg-amber-50/75 shadow-[0_14px_34px_-24px_rgba(245,158,11,0.58)] dark:border-amber-300/[0.18] dark:bg-amber-300/[0.075]"
                    : "border-slate-300/55 bg-white/35 hover:border-amber-400/45 hover:bg-amber-50/75 hover:shadow-[0_14px_34px_-24px_rgba(245,158,11,0.58)] dark:border-white/[0.065] dark:bg-white/[0.025] dark:hover:border-amber-300/[0.18] dark:hover:bg-amber-300/[0.075]",
                )}
              >
                <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-amber-300/0 blur-2xl transition-colors duration-500 group-hover:bg-amber-300/15 dark:group-hover:bg-amber-300/[0.06]" />
                <div className="relative flex items-start justify-between">
                  <Icon
                    className={cn(
                      "transition-[color,transform] duration-300 group-hover:scale-110",
                      active
                        ? "text-amber-600 dark:text-amber-300"
                        : "text-slate-600 dark:text-slate-300",
                    )}
                  />
                  {active && <Check size={16} className="text-amber-600 dark:text-amber-300" />}
                </div>
                <div className="relative mt-3 font-medium">{label}</div>
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel title="Window">
        <label className="flex items-center justify-between">
          <span>Fullscreen</span>
          <Toggle
            checked={state.settings.fullscreen}
            label="Fullscreen"
            onChange={(fullscreen) => {
              void window.hostsEditor.setFullscreen(fullscreen).then(() => {
                void saveSettings({ ...state.settings, fullscreen });
              });
            }}
          />
        </label>
      </Panel>

      <Panel title="Backups">
        <label className="flex items-center justify-between gap-6">
          <div>
            <div className="font-medium">Daily automatic backup</div>
            <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Creates a safety snapshot before the first Save of each day. Hosts Editor keeps the 7
              newest automatic backups. Manual backups are kept separately and are never pruned.
            </div>
          </div>
          <Toggle
            checked={state.settings.autoBackupOnSave}
            label="Daily automatic backup"
            onChange={(autoBackupOnSave) => {
              void saveSettings({ ...state.settings, autoBackupOnSave });
            }}
          />
        </label>
      </Panel>

      <Panel title="Updates">
        <div className="flex items-center justify-between gap-5">
          <div>
            <div className="font-medium">Version {state.version}</div>
            <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {state.update.status === "available"
                ? `Version ${state.update.version ?? "new"} is available. Please update Hosts Editor to get the latest fixes and improvements.`
                : (state.update.message ?? "Hosts Editor checks GitHub Releases for new versions.")}
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              onClick={() => {
                void checkForUpdate();
              }}
              disabled={state.update.status === "checking"}
              disabledReason={
                state.update.status === "checking"
                  ? "Update check is already in progress"
                  : undefined
              }
              className="hover:[&_svg]:rotate-180"
              icon={
                <RefreshCw
                  size={15}
                  className={state.update.status === "checking" ? "animate-spin" : undefined}
                />
              }
            >
              {state.update.status === "checking" ? "Checking..." : "Check for updates"}
            </Button>
            {state.update.status === "available" && (
              <Button
                variant="primary"
                icon={<Download size={15} />}
                onClick={() => {
                  void window.hostsEditor.openUpdate();
                }}
              >
                Download
              </Button>
            )}
          </div>
        </div>
      </Panel>

      <Panel title="Help & feedback">
        <div className="flex items-center justify-between gap-5">
          <div>
            <div className="font-medium">Help improve Hosts Editor</div>
            <div className="mt-1 max-w-xl text-sm text-slate-500 dark:text-slate-400">
              Report a problem or suggest an improvement. Your report is sent securely to NurByte
              and you receive an email confirmation. Hosts Editor never includes your hosts, IP
              addresses, backups or personal files automatically.
            </div>
          </div>
          <Button
            className="shrink-0"
            icon={<MessageSquareText size={15} />}
            onClick={() => {
              setFeedbackOpen(true);
            }}
          >
            Send feedback
          </Button>
        </div>
      </Panel>

      {feedbackOpen && (
        <FeedbackDialog
          version={state.version}
          initialKind="bug"
          onClose={() => {
            setFeedbackOpen(false);
          }}
        />
      )}
    </div>
  );
};
