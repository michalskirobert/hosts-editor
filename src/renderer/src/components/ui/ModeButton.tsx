import type { ReactNode } from "react";

interface ModeButtonProps {
  readonly active: boolean;
  readonly icon: ReactNode;
  readonly label: string;
  readonly onClick: () => void;
}
export const ModeButton = ({ active, icon, label, onClick }: ModeButtonProps) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ${active ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-500"}`}
  >
    {icon}
    {label}
  </button>
);
