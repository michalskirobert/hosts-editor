import { Button, Spinner, type ButtonProps } from "@material-tailwind/react";

import type { ReactNode, Ref } from "react";

export interface CustomButtonProps extends ButtonProps {
  loading?: boolean;
  icon?: ReactNode;
  hidden?: boolean;
  tooltip?: string;
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
  ...rest
}: CustomButtonProps) {
  if (hidden) return null;

  return (
    <span title={tooltip}>
      <Button
        {...rest}
        className={`${className ?? ""} flex items-center gap-2`}
        disabled={disabled || loading}
      >
        {!loading ? (
          <>
            {icon} {children}
          </>
        ) : (
          <span className="flex gap-2 items-center">
            <Spinner color="blue" className="h-5 w-5" /> {children}
          </span>
        )}
      </Button>
    </span>
  );
}
