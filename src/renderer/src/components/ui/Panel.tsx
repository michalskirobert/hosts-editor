import type { ReactNode } from "react";

import { cn } from "@renderer/lib/cn";

interface PanelProps {
  readonly title?: string;
  readonly children: ReactNode;
  readonly className?: string;
}

export const Panel = ({ title, children, className }: PanelProps) => (
  <section
    className={cn(
      "group/panel relative overflow-hidden rounded-3xl border border-slate-300/85 bg-white/82 p-5 shadow-[0_20px_55px_-34px_rgba(15,23,42,0.28)] backdrop-blur-3xl backdrop-saturate-150 transition-[background-color,border-color,box-shadow,transform] duration-300 ease-out hover:border-amber-300/35 hover:bg-white/94 hover:shadow-[0_24px_64px_-34px_rgba(15,23,42,0.38)] motion-reduce:transition-none dark:border-white/[0.065] dark:bg-white/[0.035] dark:shadow-[0_22px_70px_-42px_rgba(0,0,0,0.92)] dark:hover:border-amber-300/[0.13] dark:hover:bg-white/[0.052] dark:hover:shadow-[0_28px_78px_-42px_rgba(0,0,0,0.95)]",
      className,
    )}
  >
    <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent opacity-75 dark:via-white/20" />
    <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-amber-300/0 blur-3xl transition-colors duration-500 group-hover/panel:bg-amber-300/[0.08] motion-reduce:transition-none dark:group-hover/panel:bg-amber-300/[0.035]" />
    <div className="relative">
      {title && (
        <h2 className="mb-5 text-sm font-semibold tracking-[-0.01em] text-slate-800 dark:text-slate-100">
          {title}
        </h2>
      )}
      {children}
    </div>
  </section>
);
