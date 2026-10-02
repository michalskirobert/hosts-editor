import { Check } from "lucide-react";

import { cn } from "@renderer/lib/cn";

interface CheckboxProps {
  readonly checked: boolean;
  readonly label: string;
  readonly onChange: (checked: boolean) => void;
  readonly className?: string;
}

export const Checkbox = ({ checked, label, onChange, className }: CheckboxProps) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    aria-label={label}
    onClick={() => {
      onChange(!checked);
    }}
    className={cn(
      "group inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600 transition-colors duration-200 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent dark:text-slate-400 dark:hover:text-slate-100",
      className,
    )}
  >
    <span
      className={cn(
        "flex h-4.5 w-4.5 items-center justify-center rounded-md border transition-[background-color,border-color,box-shadow,transform] duration-200 group-hover:scale-105",
        checked
          ? "border-amber-400/70 bg-amber-400 text-slate-950 shadow-[0_0_14px_rgba(245,158,11,0.22)]"
          : "border-slate-300 bg-white/55 group-hover:border-amber-400/45 dark:border-white/15 dark:bg-white/[0.04] dark:group-hover:border-amber-300/30",
      )}
    >
      {checked && <Check size={12} strokeWidth={3} />}
    </span>
    <span>{label}</span>
  </button>
);
