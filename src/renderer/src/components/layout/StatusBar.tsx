import { CircleCheck, CircleDot, LoaderCircle } from "lucide-react";

import { useHostsEditorContext } from "@renderer/context/useHostsEditorContext";
import { NotificationCenter } from "../ui/NotificationCenter";

export const StatusBar = () => {
  const { state, tab, dirtyIds } = useHostsEditorContext();
  const dirty = tab ? dirtyIds.has(tab.id) : false;

  const status = state.busy
    ? {
        icon: (
          <LoaderCircle className="h-3.5 w-3.5 animate-spin text-slate-400 motion-reduce:animate-none" />
        ),
        label: "Working…",
      }
    : dirty
      ? {
          icon: <CircleDot className="h-3.5 w-3.5 text-amber-500 dark:text-amber-300" />,
          label: "Unsaved changes",
        }
      : {
          icon: <CircleCheck className="h-3.5 w-3.5 text-emerald-500" />,
          label: "No pending changes",
        };

  return (
    <footer className="relative z-20 flex h-10 shrink-0 items-center gap-3 border-t border-slate-300/60 bg-white/65 px-5 text-[11px] text-slate-500 backdrop-blur-2xl dark:border-white/[0.06] dark:bg-slate-950/50 dark:text-slate-400">
      <div className="flex min-w-0 items-center gap-2">
        {status.icon}
        <span className="truncate font-medium text-slate-600 dark:text-slate-300">
          {status.label}
        </span>
      </div>
      <NotificationCenter />
    </footer>
  );
};
