import { clsx } from "clsx";
import type { ButtonColor } from "./types";

export const colorVariants: Record<ButtonColor, string> = {
  primary: `
    border-blue-500/30
    bg-blue-600
    text-white
    hover:bg-blue-500
    focus-visible:ring-blue-500/30
    dark:bg-blue-500
    dark:hover:bg-blue-400
  `,

  secondary: `
    border-zinc-200 dark:border-zinc-800
    bg-zinc-100 dark:bg-zinc-800
    text-zinc-900 dark:text-zinc-100
    hover:bg-zinc-200 dark:hover:bg-zinc-700
    focus-visible:ring-zinc-400/20
  `,

  success: `
    border-emerald-500/30
    bg-emerald-600
    text-white
    hover:bg-emerald-500
    focus-visible:ring-emerald-500/30
    dark:bg-emerald-500
    dark:hover:bg-emerald-400
  `,

  warning: `
    border-amber-500/30
    bg-amber-600
    text-white
    hover:bg-amber-500
    focus-visible:ring-amber-500/30
    dark:bg-amber-500
    dark:hover:bg-amber-400
  `,

  danger: `
    border-red-500/30
    bg-red-600
    text-white
    hover:bg-red-500
    focus-visible:ring-red-500/30
    dark:bg-red-500
    dark:hover:bg-red-400
  `,

  info: `
    border-cyan-500/30
    bg-cyan-600
    text-white
    hover:bg-cyan-500
    focus-visible:ring-cyan-500/30
    dark:bg-cyan-500
    dark:hover:bg-cyan-400
  `,
};

export const getLiquidGlassButtonStyles = (color: ButtonColor = "primary") => {
  return clsx(
    `
      relative overflow-hidden
      inline-flex items-center justify-center gap-2
      rounded-xl border
      px-4 py-2.5
      text-sm font-medium
      transition-all duration-150
      shadow-sm
      hover:-translate-y-[1px]
      active:translate-y-0
      focus-visible:outline-none
      focus-visible:ring-2
      disabled:pointer-events-none
      disabled:opacity-50
      dark:shadow-black/30
    `,
    colorVariants[color],
  );
};
