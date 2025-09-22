import { useController, type FieldValues } from "react-hook-form";
import type { InputProps } from "./types";
import { Feedback } from "./Feedback";

export const Input = <T extends FieldValues>({
  control,
  name,
  label,
  ...restProps
}: InputProps<T>) => {
  const { field, fieldState } = useController({ name, control });
  return (
    <div className="w-full">
      {label && <label htmlFor={name}>{label}</label>}
      <input
        id={name}
        className="w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
        {...restProps}
        {...field}
        type={restProps.type ? restProps.type : "text"}
      />
      <Feedback {...fieldState} />
    </div>
  );
};
