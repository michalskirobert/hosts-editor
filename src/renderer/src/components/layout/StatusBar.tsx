import { CircleCheck, CircleDot, LoaderCircle } from "lucide-react";

import { useHostsEditorContext } from "@renderer/context/useHostsEditorContext";

export const StatusBar = () => {
  const { state, tab, dirtyIds } = useHostsEditorContext();
  const dirty = tab ? dirtyIds.has(tab.id) : false;

  const status = state.busy
    ? {
        icon: <LoaderCircle className="h-3.5 w-3.5 animate-spin text-slate-400" />,
        label: "Working…",
      }
    : dirty
      ? {
          icon: <CircleDot className="h-3.5 w-3.5 text-amber-500 dark:text-amber-300" />,
          label: "Unsaved changes",
        }
      : {
          icon: <CircleCheck className="h-3.5 w-3.5 text-emerald-400" />,
          label: "System hosts up to date",
        };

  return (
    <footer className="relative z-20 flex h-10 items-center border-t border-slate-300/60 bg-white/58 px-5 text-[11px] text-slate-500 backdrop-blur-2xl backdrop-saturate-150 dark:border-white/[0.06] dark:bg-slate-950/28 dark:text-slate-400">
      <div className="flex items-center gap-2">
        {status.icon}
        <span className="font-medium text-slate-600 dark:text-slate-300">{status.label}</span>
      </div>
    </footer>
  );
};
