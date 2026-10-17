import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";

import { cn } from "@renderer/lib/cn";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  readonly invalid?: boolean;
  readonly monospace?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ invalid = false, monospace = false, className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "block min-h-26 w-full resize-y overflow-y-auto rounded-xl border px-3 py-2 text-sm shadow-sm outline-none",
        "bg-white/58 text-slate-900 placeholder:text-slate-400 backdrop-blur-xl",
        "transition-[background-color,border-color,box-shadow] duration-200 hover:bg-white/78 focus:ring-2",
        "dark:bg-white/[0.035] dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:bg-white/[0.055]",
        "scrollbar-thin [scrollbar-color:rgba(100,116,139,0.45)_transparent]",
        "[&::-webkit-resizer]:border-0 [&::-webkit-resizer]:bg-transparent [&::-webkit-resizer]:shadow-none",
        "[&::-webkit-scrollbar-corner]:border-0 [&::-webkit-scrollbar-corner]:bg-transparent [&::-webkit-scrollbar-corner]:shadow-none",
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

Textarea.displayName = "Textarea";
