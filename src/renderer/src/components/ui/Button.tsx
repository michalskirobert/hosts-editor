import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@renderer/lib/cn";
import { Tooltip } from "./Tooltip";

type ButtonVariant = "primary" | "secondary" | "warning" | "danger" | "ghost";
type ButtonSize = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly icon?: ReactNode;
  readonly disabledReason?: string | undefined;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "border-amber-300/55 bg-gradient-to-b from-amber-300 to-amber-500 font-semibold text-slate-950 shadow-[0_12px_28px_-14px_rgba(245,158,11,0.72)] hover:border-amber-200/85 hover:from-amber-200 hover:to-amber-400 hover:shadow-[0_18px_38px_-14px_rgba(245,158,11,0.82)] dark:border-amber-200/25 dark:from-amber-300 dark:to-amber-400",
  secondary:
    "border-slate-300/90 bg-white/88 text-slate-800 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.48)] backdrop-blur-xl hover:border-amber-300/35 hover:bg-amber-50/75 hover:text-slate-950 hover:shadow-[0_14px_32px_-20px_rgba(245,158,11,0.34)] dark:border-white/[0.075] dark:bg-white/[0.045] dark:text-slate-200 dark:hover:border-amber-300/[0.16] dark:hover:bg-amber-300/[0.075] dark:hover:text-amber-50 dark:hover:shadow-[0_14px_34px_-20px_rgba(245,158,11,0.22)]",
  warning:
    "border-orange-300/40 bg-gradient-to-b from-orange-300 to-orange-500 font-semibold text-slate-950 shadow-[0_10px_24px_-14px_rgba(249,115,22,0.65)] hover:from-orange-200 hover:to-orange-400 hover:shadow-[0_16px_30px_-14px_rgba(249,115,22,0.68)]",
  danger:
    "border-red-400/15 bg-red-500/[0.045] font-medium text-red-600 hover:border-red-400/35 hover:bg-red-500 hover:text-white hover:shadow-[0_14px_30px_-16px_rgba(239,68,68,0.72)] dark:text-red-400 dark:hover:text-white",
  ghost:
    "border-transparent bg-transparent text-slate-500 hover:border-amber-300/25 hover:bg-amber-50/60 hover:text-slate-900 dark:text-slate-400 dark:hover:border-amber-300/[0.12] dark:hover:bg-amber-300/[0.055] dark:hover:text-slate-100",
};

const sizes: Record<ButtonSize, string> = {
  sm: "rounded-xl px-3 py-1.5 text-sm",
  md: "rounded-2xl px-4 py-2.5 text-sm",
};

export const Button = ({
  variant = "secondary",
  size = "md",
  icon,
  className,
  children,
  type = "button",
  disabled,
  disabledReason,
  ...props
}: ButtonProps) => {
  const button = (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        "group relative isolate inline-flex cursor-pointer items-center justify-center gap-2 overflow-hidden border transition-[transform,background-color,border-color,color,box-shadow] duration-300 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 motion-safe:active:scale-[0.98] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:active:scale-100",
        "before:pointer-events-none before:absolute before:inset-y-0 before:-left-1/2 before:-z-10 before:w-1/3 before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/35 before:to-transparent before:opacity-0 before:transition-[left,opacity] before:duration-500 motion-safe:hover:before:left-[120%] motion-safe:hover:before:opacity-70 motion-reduce:before:hidden",
        "[&_svg]:transition-[transform,color] [&_svg]:duration-300 motion-safe:hover:[&_svg]:scale-110 motion-reduce:[&_svg]:transition-none",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );

  if (!disabled || !disabledReason) return button;

  return (
    <Tooltip label={disabledReason}>
      <span className="inline-flex" tabIndex={0} aria-label={disabledReason}>
        {button}
      </span>
    </Tooltip>
  );
};
