import { Button, Spinner, type ButtonProps } from "@material-tailwind/react";
import type { ReactNode } from "react";

interface Props extends Omit<ButtonProps, "color" | "children"> {
  children?: ReactNode;
  loading?: boolean;
  icon?: ReactNode;
  hidden?: boolean;
  color?: ButtonProps["color"] | "black";
  tooltip?: "string";
}

export function CustomButton({
  loading,
  icon,
  hidden,
  className,
  children,
  disabled,
  tooltip,
  ...rest
}: Props & any) {
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
            <Spinner color="blue" /> {children}
          </span>
        )}
      </Button>
    </span>
  );
}
