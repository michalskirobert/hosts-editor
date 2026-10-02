import type { InputHTMLAttributes } from "react";

import { cn } from "@renderer/lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly invalid?: boolean;
  readonly monospace?: boolean;
}

export const Input = ({ invalid = false, monospace = false, className, ...props }: InputProps) => (
  <input
    className={cn(
      "w-full rounded-xl border bg-white/64 px-2.5 py-2 text-sm shadow-sm outline-none backdrop-blur-xl transition-all duration-200 hover:bg-white/82 focus:ring-2 dark:bg-white/[0.035] dark:hover:bg-white/[0.055]",
      invalid
        ? "border-red-400/70 bg-red-50/50 focus:border-red-400 focus:ring-red-500/15 dark:bg-red-500/[0.055]"
        : "border-slate-300/75 hover:border-slate-300 focus:border-amber-400/60 focus:bg-white/72 focus:ring-amber-500/15 dark:border-white/10 dark:focus:border-amber-300/40 dark:focus:bg-white/[0.06]",
      monospace && "font-mono",
      className,
    )}
    {...props}
  />
);
