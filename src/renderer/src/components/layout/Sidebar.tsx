import { ArchiveRestore, FileCode2, Settings } from "lucide-react";
import type { ReactNode } from "react";

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
    className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
      active
        ? "bg-slate-100 font-medium dark:bg-white/7"
        : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-white/4"
    }`}
  >
    {icon}
    {label}
  </button>
);

export const Sidebar = () => {
  const { state, patchState, loadBackups } = useHostsEditorContext();

  const openPage = (page: Page): void => {
    patchState({ page });
  };

  return (
    <aside className="relative w-69 shrink-0 border-r border-slate-200 bg-white px-3 pb-4 pt-6 dark:border-white/8 dark:bg-[#0d131d]">
      <div className="mb-7 flex items-center gap-3 px-3">
        <img
          src={hostsEditorLogo}
          alt="Hosts Editor"
          className="h-11 w-11 rounded-xl object-contain"
        />
        <div>
          <div className="font-semibold">Hosts Editor</div>
          <div className="text-xs text-slate-400">NurByte · v{state.version}</div>
        </div>
      </div>
      <SideButton
        active={state.page === "editor"}
        label="Hosts"
        icon={<FileCode2 size={17} />}
        onClick={() => {
          openPage("editor");
        }}
      />
      <SideButton
        active={state.page === "backups"}
        label="Backups"
        icon={<ArchiveRestore size={17} />}
        onClick={() => {
          void loadBackups();
        }}
      />
      <SideButton
        active={state.page === "settings"}
        label="Settings"
        icon={<Settings size={17} />}
        onClick={() => {
          openPage("settings");
        }}
      />
      <TabList />
      <div className="absolute bottom-4 left-3 right-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs dark:border-white/8 dark:bg-white/4">
        <div className="mb-1 font-medium text-emerald-600">● Safe write + recovery backup</div>
        <div className="truncate text-slate-400">{state.hostsPath}</div>
      </div>
    </aside>
  );
};
