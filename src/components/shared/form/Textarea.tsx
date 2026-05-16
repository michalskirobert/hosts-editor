import { useController, type FieldValues } from "react-hook-form";
import type { CustomTextareaProps } from "./types";
import { Feedback } from "./Feedback";

export const CustomTextarea = <T extends FieldValues>({
  control,
  name,
  label,
  ...restProps
}: CustomTextareaProps<T>) => {
  const { field, fieldState } = useController({ name, control });
  return (
    <div className="w-full space-y-2">
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors duration-200"
        >
          {label}
        </label>
      )}
      <div
        className={`
          rounded-xl border
          bg-white dark:bg-zinc-900/60
          transition-all duration-200
          hover:border-zinc-300 dark:hover:border-zinc-700
          ${
            fieldState.invalid
              ? "border-red-500 dark:border-red-500 focus-within:border-red-500 focus-within:shadow-[0_0_0_2px_rgba(239,68,68,0.18)]"
              : "border-zinc-200 dark:border-zinc-800 focus-within:border-blue-500 focus-within:shadow-[0_0_0_2px_rgba(59,130,246,0.15)]"
          }
        `}
      >
        <textarea
          id={name}
          {...restProps}
          {...field}
          className={`
            w-full rounded-xl bg-transparent px-4 py-3
            text-sm text-zinc-900 dark:text-zinc-100 outline-none resize-none
            placeholder:text-zinc-400 dark:placeholder:text-zinc-500
            disabled:cursor-not-allowed disabled:bg-zinc-100/50 dark:disabled:bg-zinc-800/50 dark:disabled:text-zinc-400
            transition-colors duration-200
            ${restProps?.className || ""}
          `}
        />
      </div>
      <Feedback {...fieldState} />
    </div>
  );
};
