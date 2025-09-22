import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2.5 text-center font-medium hover:bg-opacity-90 font-medium transition focus:outline-none",
  {
    variants: {
      variant: {
        primary: "!bg-[#5750F1] text-white",
        green: "!bg-[#2CD673] text-white",
        dark: "!bg-[#111928] text-white dark:bg-white/10",
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
  };

export function Button({
  label,
  icon,
  variant,
  shape,
  size,
  className,
  hidden,
  ...props
}: ButtonProps) {
  if (hidden) return null;
  return (
    <button
      className={buttonVariants({ variant, shape, size, className })}
      {...props}
      type={props.type ? props.type : "button"}
    >
      {icon && <span>{icon}</span>}
      {label}
    </button>
  );
}
