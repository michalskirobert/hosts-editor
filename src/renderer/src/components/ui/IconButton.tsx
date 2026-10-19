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
  "aria-disabled": ariaDisabled,
  disabledReason,
  ...props
}: IconButtonProps) => {
  const unavailable = disabled === true || ariaDisabled === true || ariaDisabled === "true";
  const button = (
    <button
      type={type}
      disabled={unavailable}
      aria-disabled={ariaDisabled}
      aria-label={label}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center rounded-xl border border-transparent p-2 transition-[background-color,border-color,color,box-shadow,opacity] duration-200 ease-out motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 disabled:cursor-not-allowed disabled:opacity-45 disabled:transition-none",
        danger
          ? "text-red-500/75 enabled:hover:border-red-400/20 enabled:hover:bg-red-500/10 enabled:hover:text-red-600 enabled:hover:shadow-[0_8px_20px_-14px_rgba(239,68,68,0.8)] dark:text-red-400/75 dark:enabled:hover:text-red-300"
          : "text-slate-500 enabled:hover:border-slate-200/80 enabled:hover:bg-white/85 enabled:hover:text-slate-950 enabled:hover:shadow-[0_8px_20px_-15px_rgba(15,23,42,0.65)] dark:text-slate-400 dark:enabled:hover:border-white/10 dark:enabled:hover:bg-white/[0.08] dark:enabled:hover:text-white",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );

  const tooltip = unavailable && disabledReason ? disabledReason : label;
  return (
    <Tooltip label={tooltip}>
      <span className="inline-flex" tabIndex={unavailable && disabledReason ? 0 : -1}>
        {button}
      </span>
    </Tooltip>
  );
};
