import type { ReactNode } from "react";

import { cn } from "@renderer/lib/cn";

interface ModeButtonProps {
  readonly active: boolean;
  readonly icon: ReactNode;
  readonly label: string;
  readonly onClick: () => void;
}

export const ModeButton = ({ active, icon, label, onClick }: ModeButtonProps) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onClick}
    className={cn(
      "flex h-9 cursor-pointer items-center gap-2 rounded-xl px-3 text-sm transition-[background-color,border-color,color,box-shadow] duration-300 ease-out motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/35",
      active
        ? "bg-amber-100/80 text-amber-950 shadow-[0_4px_12px_-8px_rgba(245,158,11,0.65)] dark:bg-amber-300/[0.10] dark:text-amber-100"
        : "text-slate-600 hover:bg-amber-100/80 hover:text-amber-950 hover:shadow-[0_4px_12px_-8px_rgba(245,158,11,0.65)] dark:text-slate-400 dark:hover:bg-amber-300/[0.10] dark:hover:text-amber-100",
    )}
  >
    {icon}
    {label}
  </button>
);
