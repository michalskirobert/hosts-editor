import {
  ArchiveRestore,
  CircleAlert,
  CircleCheck,
  ExternalLink,
  FileCode2,
  Settings,
  ShieldCheck,
} from "lucide-react";
import type { ReactNode } from "react";

import { ScrollArea } from "@renderer/components/ui/ScrollArea";
import { TabList } from "../../features/tabs/TabList";
import type { Page } from "../../types/navigation";
import { useHostsEditorContext } from "@renderer/context/useHostsEditorContext";
import hostsEditorLogo from "@renderer/assets/hosts_editor.png";

interface SideButtonProps {
  readonly active: boolean;
  readonly label: string;
  readonly icon: ReactNode;
  readonly onClick: () => void;
}

const SideButton = ({ active, label, icon, onClick }: SideButtonProps) => (
  <button
    onClick={onClick}
    className={`group mb-1 flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm transition-[background-color,border-color,color,box-shadow,transform] duration-300 ease-out motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/35 ${active ? "translate-x-1 border-amber-300/45 bg-amber-50/75 font-medium text-slate-950 shadow-[0_12px_32px_-24px_rgba(245,158,11,0.58)] dark:border-amber-300/[0.14] dark:bg-amber-300/[0.07] dark:text-white" : "border-transparent text-slate-600 motion-safe:hover:translate-x-1 hover:border-amber-300/25 hover:bg-amber-50/60 hover:text-slate-950 hover:shadow-[0_12px_28px_-24px_rgba(245,158,11,0.42)] dark:text-slate-400 dark:hover:border-amber-300/[0.10] dark:hover:bg-amber-300/[0.045] dark:hover:text-slate-100"}`}
  >
    <span
      className={`${active ? "text-amber-600 dark:text-amber-300" : ""} transition-[color,transform] duration-300 group-hover:scale-110 group-hover:text-amber-600 dark:group-hover:text-amber-300`}
    >
      {icon}
    </span>
    {label}
  </button>
);

export const Sidebar = () => {
  const { state, patchState, loadBackups } = useHostsEditorContext();
  const updateAvailable = state.update.status === "available";
  const openPage = (page: Page): void => {
    patchState({ page });
  };

  return (
    <aside className="relative z-20 flex w-69 shrink-0 flex-col border-r border-slate-300/60 bg-white/62 px-3 pb-4 pt-6 shadow-[12px_0_45px_-35px_rgba(15,23,42,0.35)] backdrop-blur-3xl backdrop-saturate-150 dark:border-white/[0.07] dark:bg-[#07101a]/58 dark:shadow-[12px_0_55px_-38px_rgba(0,0,0,0.9)]">
      <div className="mb-7 flex items-center gap-3 px-3">
        <div className="rounded-2xl border border-slate-300/60 bg-white/72 p-1 shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
          <img
            src={hostsEditorLogo}
            alt="Hosts Editor"
            className="h-10 w-10 rounded-xl object-contain"
          />
        </div>
        <div className="min-w-0">
          <div className="font-semibold tracking-[-0.02em]">Hosts Editor</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            NurByte · v{state.version}
          </div>
        </div>
      </div>
      <nav>
        <SideButton
          active={state.page === "editor"}
          label="Hosts"
          icon={<FileCode2 size={18} />}
          onClick={() => {
            openPage("editor");
          }}
        />
        <SideButton
          active={state.page === "backups"}
          label="Backups"
          icon={<ArchiveRestore size={18} />}
          onClick={() => {
            void loadBackups();
          }}
        />
        <SideButton
          active={state.page === "settings"}
          label="Settings"
          icon={
            <span className="relative">
              <Settings size={18} />
              {updateAvailable && (
                <CircleAlert
                  size={11}
                  className="absolute -right-2 -top-2 fill-amber-400 text-amber-400"
                />
              )}
            </span>
          }
          onClick={() => {
            openPage("settings");
          }}
        />
      </nav>
      <ScrollArea className="min-h-0 flex-1 pr-1">
        <TabList />
      </ScrollArea>
      <button
        type="button"
        onClick={() => {
          void window.hostsEditor.openExternal("https://nurbyte.dev");
        }}
        className="group mb-2 flex w-full cursor-pointer items-center justify-between rounded-2xl border border-transparent px-3 py-2 text-left transition-[background-color,border-color,transform] duration-300 hover:border-amber-300/20 hover:bg-amber-300/[0.055] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/35 dark:hover:border-amber-300/[0.10] dark:hover:bg-amber-300/[0.045]"
        aria-label="Open NurByte website"
      >
        <span>
          <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
            Made by
          </span>
          <span className="mt-0.5 block text-xs font-semibold text-slate-600 transition-colors group-hover:text-amber-700 dark:text-slate-400 dark:group-hover:text-amber-300">
            NurByte Software Lab
          </span>
        </span>
        <ExternalLink
          size={13}
          className="text-slate-400 transition-[color,transform] duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-amber-600 dark:text-slate-600 dark:group-hover:text-amber-300"
        />
      </button>
      <div className="mt-1 rounded-2xl border border-slate-300/60 bg-white/60 px-3 py-3 text-xs shadow-sm backdrop-blur-2xl dark:border-white/[0.07] dark:bg-white/[0.035]">
        <div className="mb-2 flex items-center gap-2 font-medium text-slate-600 dark:text-slate-300">
          <ShieldCheck className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
          Safe write enabled
        </div>
        <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
          {state.settings.autoBackupOnSave ? (
            <CircleCheck className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <CircleAlert className="h-3.5 w-3.5 text-slate-400" />
          )}
          <span>{state.settings.autoBackupOnSave ? "Daily auto-backup" : "Manual backups"}</span>
        </div>
        <div className="mt-2 truncate text-slate-400 dark:text-slate-600" title={state.hostsPath}>
          {state.hostsPath}
        </div>
      </div>
    </aside>
  );
};
