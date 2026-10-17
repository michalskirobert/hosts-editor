import { Check, MessageSquareText, Moon, Settings, Sun } from "lucide-react";
import { useState } from "react";

import { Button } from "../../components/ui/Button";
import { Panel } from "../../components/ui/Panel";
import { Toggle } from "../../components/shared/form";
import { cn } from "@renderer/lib/cn";
import { useHostsEditorContext } from "@renderer/context/useHostsEditorContext";
import { FeedbackDialog } from "@renderer/features/feedback/FeedbackDialog";

import { UpdateControls } from "./UpdateControls";

const themes = [
  { id: "system", label: "System", icon: Settings },
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
] as const;

export const SettingsPage = () => {
  const { state, saveSettings } = useHostsEditorContext();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

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
                  "group relative overflow-hidden rounded-2xl border p-4 text-left transition-[background-color,border-color,box-shadow] duration-300 ease-out motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40",
                  active
                    ? "border-amber-400/45 bg-amber-50/75 shadow-[0_14px_34px_-24px_rgba(245,158,11,0.58)] dark:border-amber-300/[0.18] dark:bg-amber-300/[0.075]"
                    : "border-slate-300/70 bg-white/46 hover:border-amber-400/55 hover:bg-amber-50/70 hover:shadow-[0_14px_34px_-24px_rgba(245,158,11,0.58)] dark:border-white/[0.065] dark:bg-white/[0.025] dark:hover:border-amber-300/[0.18] dark:hover:bg-amber-300/[0.075]",
                )}
              >
                <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-amber-300/0 blur-2xl transition-colors duration-500 group-hover:bg-amber-300/15 dark:group-hover:bg-amber-300/[0.06]" />
                <div className="relative flex items-start justify-between">
                  <Icon
                    className={cn(
                      "transition-colors duration-200",
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
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
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
        <UpdateControls />
      </Panel>

      <Panel title="Help & feedback">
        <div className="flex items-center justify-between gap-5">
          <div>
            <div className="font-medium">Help improve Hosts Editor</div>
            <div className="mt-1 max-w-xl text-sm text-slate-600 dark:text-slate-400">
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
