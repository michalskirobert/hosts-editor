import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

import { cn } from "@renderer/lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly invalid?: boolean;
  readonly monospace?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ invalid = false, monospace = false, className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-xl border bg-white/90 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none dark:text-slate-100 dark:placeholder:text-slate-500 backdrop-blur-xl transition-all duration-200 hover:bg-white focus:ring-2 dark:bg-white/[0.035] dark:hover:bg-white/[0.055]",
        invalid
          ? "border-red-400/70 bg-red-50/50 focus:border-red-400 focus:ring-red-500/15 dark:bg-red-500/[0.055]"
          : "border-slate-300 hover:border-slate-300 focus:border-amber-400/60 focus:bg-white/72 focus:ring-amber-500/15 dark:border-white/10 dark:focus:border-amber-300/40 dark:focus:bg-white/[0.06]",
        monospace && "font-mono",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";
