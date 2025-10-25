import { Button, type ButtonProps } from "@material-tailwind/react";
import { Spinner } from "@utils/Icons";
import type { ReactNode } from "react";

interface Props extends Omit<ButtonProps, "color" | "children"> {
  children?: ReactNode;
  loading?: boolean;
  icon?: ReactNode;
  hidden?: boolean;
  color?: ButtonProps["color"] | "black";
}

export function CustomButton({
  loading,
  icon,
  hidden,
  className,
  children,
  disabled,
  ...rest
}: Props & any) {
  if (hidden) return null;

  return (
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
          <Spinner /> {children}
        </span>
      )}
    </Button>
  );
}
