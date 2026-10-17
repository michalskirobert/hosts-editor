import { Check } from "lucide-react";

import { cn } from "@renderer/lib/cn";

interface CheckboxProps {
  readonly checked: boolean;
  readonly label: string;
  readonly onChange: (checked: boolean) => void;
  readonly className?: string;
}

export const Checkbox = ({ checked, label, onChange, className }: CheckboxProps) => (
  <label
    className={cn(
      "inline-flex cursor-pointer items-start gap-2.5 text-left text-sm leading-5 text-slate-700 dark:text-slate-300",
      className,
    )}
  >
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => {
        onChange(event.target.checked);
      }}
      className="peer sr-only"
    />
    <span
      aria-hidden="true"
      className={cn(
        "mt-px inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-colors duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-amber-500/60 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-white motion-reduce:transition-none dark:peer-focus-visible:ring-offset-[#0b111b]",
        checked
          ? "border-amber-400 bg-amber-400 text-slate-950"
          : "border-slate-400 bg-white/70 peer-hover:border-amber-500 dark:border-slate-500 dark:bg-white/5 dark:peer-hover:border-amber-300",
      )}
    >
      {checked && <Check size={12} strokeWidth={3} />}
    </span>
    <span className="min-w-0 flex-1 break-words">{label}</span>
  </label>
);
