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
          className="block text-sm font-medium text-slate-700 transition-colors duration-200"
        >
          {label}
        </label>
      )}
      <div
        className={`
          rounded-xl border bg-white transition-all duration-200
          ${
            fieldState.invalid
              ? "border-red-500 focus-within:border-red-500 focus-within:shadow-[0_0_0_2px_rgba(239,68,68,0.14)]"
              : "border-slate-200 focus-within:border-blue-500 focus-within:shadow-[0_0_0_2px_rgba(59,130,246,0.15)]"
          }
          hover:border-slate-300
        `}
      >
        <textarea
          id={name}
          {...restProps}
          {...field}
          className={`
            w-full rounded-xl bg-transparent px-4 py-3
            text-sm text-slate-900 outline-none resize-none
            placeholder:text-slate-400
            disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400
            ${restProps?.className || ""}
          `}
        />
      </div>
      <Feedback {...fieldState} />
    </div>
  );
};
