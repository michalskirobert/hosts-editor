import { useController, type FieldValues } from "react-hook-form";
import type { CustomInputProps } from "./types";
import { Feedback } from "./Feedback";

export const CustomInput = <T extends FieldValues>({
  control,
  name,
  style,
  label,
  ...restProps
}: CustomInputProps<T>) => {
  const { field, fieldState } = useController({ name, control });
  return (
    <div className="w-full space-y-2">
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors duration-200 ml-1"
        >
          {label}
        </label>
      )}
      <div
        className={`
          rounded-xl border
          bg-white dark:bg-zinc-900/60
          shadow-sm
          transition-all duration-200
          border-zinc-200 dark:border-zinc-800
          hover:border-zinc-300 dark:hover:border-zinc-700
          hover:bg-white/80 dark:hover:bg-zinc-900/80
          ${
            fieldState.invalid
              ? "!border-red-500 dark:!border-red-500 focus-within:border-red-500 focus-within:shadow-[0_0_0_2px_rgba(239,68,68,0.18)]"
              : "focus-within:border-blue-500 focus-within:shadow-[0_0_0_2px_rgba(59,130,246,0.15)]"
          }
        `}
      >
        <input
          {...restProps}
          {...field}
          id={name}
          className={`
            w-full rounded-xl bg-transparent px-4 py-3
            text-sm text-zinc-900 dark:text-zinc-100 outline-none
            placeholder:text-zinc-400 dark:placeholder:text-zinc-500
            transition-colors duration-200
            disabled:cursor-not-allowed disabled:bg-zinc-100/50 disabled:text-zinc-400
            ${restProps?.className || ""}
          `}
          type={restProps.type ? restProps.type : "text"}
          ref={field.ref}
        />
      </div>

      <Feedback {...fieldState} />
    </div>
  );
};
