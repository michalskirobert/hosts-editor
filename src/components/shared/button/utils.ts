import { clsx } from "clsx";
import type { ButtonColor } from "./types";

export const colorVariants: Record<ButtonColor, string> = {
  primary: `
    border-blue-200/30
    bg-blue-500/80
    text-white
    shadow-blue-500/30
    hover:bg-blue-500/90
    hover:border-blue-100/40
    focus-visible:ring-blue-400/30
  `,

  secondary: `
    border-slate-200/20
    bg-slate-700/70
    text-white
    shadow-black/20
    hover:bg-slate-700/80
    hover:border-slate-100/30
    focus-visible:ring-slate-300/20
  `,

  success: `
    border-emerald-200/30
    bg-emerald-500/80
    text-white
    shadow-emerald-500/30
    hover:bg-emerald-500/90
    hover:border-emerald-100/40
    focus-visible:ring-emerald-400/30
  `,

  warning: `
    border-amber-200/30
    bg-amber-500/80
    text-white
    shadow-amber-500/30
    hover:bg-amber-500/90
    hover:border-amber-100/40
    focus-visible:ring-amber-400/30
  `,

  danger: `
    border-red-200/30
    bg-red-500/80
    text-white
    shadow-red-500/30
    hover:bg-red-500/90
    hover:border-red-100/40
    focus-visible:ring-red-400/30
  `,

  info: `
    border-cyan-200/30
    bg-cyan-500/80
    text-white
    shadow-cyan-500/30
    hover:bg-cyan-500/90
    hover:border-cyan-100/40
    focus-visible:ring-cyan-400/30
  `,
};

export const getLiquidGlassButtonStyles = (color: ButtonColor = "primary") => {
  return clsx(
    `
      relative overflow-hidden
      inline-flex items-center justify-center gap-2
      rounded-xl border
      px-4 py-2.5
      text-sm font-semibold
      backdrop-blur-md
      transition-all duration-200
      shadow-lg
      hover:-translate-y-[1px]
      active:translate-y-0
      focus-visible:outline-none
      focus-visible:ring-4
      disabled:pointer-events-none
      disabled:opacity-50
      before:absolute before:inset-0
      before:bg-gradient-to-b
      before:from-white/20 before:via-white/5 before:to-transparent
      before:pointer-events-none
    `,
    colorVariants[color],
  );
};
