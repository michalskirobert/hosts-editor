import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { Spinner } from "../../utils/Icons";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2.5 text-center font-medium hover:!opacity-75 font-medium transition transition-color duration-500",
  {
    variants: {
      variant: {
        primary: "!bg-[#5750F1] text-white",
        green: "!bg-[#2CD673] text-black",
        dark: "!bg-[#111928] text-white dark:bg-white/10",
        warning: "!bg-amber-400 text-black",
        info: "!bg-blue-400 text-white",
        danger: "!bg-red-600 text-white",
        disabled: "!bg-gray text-black",
        loading: "!bg-gray text-black !cursor-wait",
      },
      shape: {
        default: "",
        rounded: "rounded-[5px]",
        full: "rounded-full",
      },
      size: {
        default: "py-3.5 px-10 py-3.5 lg:px-8 xl:px-10",
        small: "py-[11px] px-6",
      },
    },
    defaultVariants: {
      variant: "primary",
      shape: "default",
      size: "default",
    },
  }
);

type ButtonProps = HTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    label: string;
    icon?: React.ReactNode;
    type?: "submit" | "reset" | "button";
    isLoading?: boolean;
    disabled?: boolean;
  };

export function Button({
  label,
  icon,
  variant,
  shape,
  size,
  className,
  hidden,
  isLoading,
  ...props
}: ButtonProps) {
  if (hidden) return null;

  if (isLoading)
    return (
      <button
        className={buttonVariants({
          variant: "loading",
          shape,
          size,
          className,
        })}
        disabled
      >
        <Spinner />
        {label}
      </button>
    );

  return (
    <button
      className={buttonVariants({
        variant: props.disabled ? "disabled" : variant,
        shape,
        size,
        className,
      })}
      {...props}
      type={props.type ? props.type : "button"}
    >
      {icon && <span>{icon}</span>}
      {label}
    </button>
  );
}
