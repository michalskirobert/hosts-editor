import { cn } from "@renderer/lib/cn";

interface ToggleProps {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly label: string;
  readonly disabled?: boolean;
  readonly className?: string;
}

export const Toggle = ({ checked, onChange, label, disabled = false, className }: ToggleProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    title={label}
    disabled={disabled}
    onClick={() => {
      onChange(!checked);
    }}
    className={cn(
      "group relative h-7 w-12 shrink-0 cursor-pointer rounded-full border p-0.5 shadow-inner transition-[background-color,border-color,box-shadow,transform] duration-300 ease-out motion-safe:hover:scale-[1.04] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 disabled:cursor-not-allowed disabled:opacity-50",
      checked
        ? "border-amber-400/45 bg-gradient-to-r from-amber-400 to-amber-300 shadow-[0_0_20px_-8px_rgba(245,158,11,0.9)]"
        : "border-slate-300/70 bg-slate-300/60 hover:bg-slate-300/85 dark:border-white/[0.09] dark:bg-white/[0.07] dark:hover:bg-white/[0.11]",
      className,
    )}
  >
    <span
      className={cn(
        "block h-5.5 w-5.5 rounded-full bg-white shadow-[0_3px_9px_rgba(15,23,42,0.25)] transition-transform duration-300 ease-out group-hover:shadow-[0_4px_12px_rgba(15,23,42,0.32)]",
        checked && "translate-x-5",
      )}
    />
  </button>
);
