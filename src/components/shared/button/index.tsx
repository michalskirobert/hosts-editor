import clsx from "clsx";

import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import type { ButtonColor } from "./types";
import { getLiquidGlassButtonStyles } from "./utils";
import { CustomLoader } from "@shared/Loader";

export interface CustomButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  icon?: ReactNode;
  hidden?: boolean;
  tooltip?: string;
  color?: ButtonColor;
  ref?: Ref<HTMLButtonElement>;
}

export function CustomButton({
  loading,
  icon,
  hidden,
  children,
  tooltip,
  className,
  disabled,
  color = "primary",
  ...rest
}: CustomButtonProps) {
  if (hidden) return null;

  return (
    <span title={tooltip}>
      <button
        {...rest}
        className={clsx(getLiquidGlassButtonStyles(color), className)}
        disabled={disabled || loading}
      >
        {!loading ? (
          <>
            {icon}
            <span className="relative z-10">{children}</span>
          </>
        ) : (
          <span className="relative z-10 flex items-center gap-2">
            <CustomLoader size="sm" />
            {children}
          </span>
        )}
      </button>
    </span>
  );
}
