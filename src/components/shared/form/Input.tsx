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
          className="block text-sm font-medium text-slate-700 transition-colors duration-200 ml-1"
        >
          {label}
        </label>
      )}
      <div
        className={`
          rounded-xl border
          bg-white/70 backdrop-blur-md
          shadow-sm
          transition-all duration-200
          border-slate-200/60
          ${
            fieldState.invalid
              ? "!border-red-400 focus-within:border-red-400 focus-within:shadow-[0_0_0_2px_rgba(239,68,68,0.14)]"
              : "focus-within:border-blue-400 focus-within:shadow-[0_0_0_2px_rgba(59,130,246,0.10)]"
          }
          hover:border-slate-300
          hover:bg-white/80
        `}
      >
        <input
          {...restProps}
          {...field}
          id={name}
          className={`
            w-full rounded-xl bg-transparent px-4 py-3
            text-sm text-slate-900 outline-none
            placeholder:text-slate-400
            transition-colors duration-200
            disabled:cursor-not-allowed disabled:bg-slate-100/50 disabled:text-slate-400
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
