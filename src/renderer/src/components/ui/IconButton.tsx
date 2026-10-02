import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@renderer/lib/cn";
import { Tooltip } from "./Tooltip";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly label: string;
  readonly children: ReactNode;
  readonly danger?: boolean;
  readonly disabledReason?: string | undefined;
}

export const IconButton = ({
  label,
  children,
  danger = false,
  className,
  type = "button",
  disabled,
  disabledReason,
  ...props
}: IconButtonProps) => {
  const button = (
    <button
      type={type}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center rounded-xl border border-transparent p-2 transition-all duration-200 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.03] motion-safe:active:translate-y-0 motion-safe:active:scale-95 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:scale-100",
        danger
          ? "text-red-500/75 hover:border-red-400/20 hover:bg-red-500/10 hover:text-red-600 hover:shadow-[0_8px_20px_-14px_rgba(239,68,68,0.8)] dark:text-red-400/75 dark:hover:text-red-300"
          : "text-slate-500 hover:border-slate-200/80 hover:bg-white/85 hover:text-slate-950 hover:shadow-[0_8px_20px_-15px_rgba(15,23,42,0.65)] dark:text-slate-400 dark:hover:border-white/10 dark:hover:bg-white/[0.08] dark:hover:text-white",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );

  const tooltip = disabled && disabledReason ? disabledReason : label;
  return (
    <Tooltip label={tooltip}>
      <span className="inline-flex" tabIndex={disabled && disabledReason ? 0 : -1}>
        {button}
      </span>
    </Tooltip>
  );
};
