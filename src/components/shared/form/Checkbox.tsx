import { useController, type FieldValues } from "react-hook-form";
import type { CheckboxProps } from "./types";
import { Feedback } from "./Feedback";

export const Checkbox = <T extends FieldValues>({
  control,
  name,
  label,
  ...restProps
}: CheckboxProps<T>) => {
  const { field, fieldState } = useController({ name, control });

  return (
    <div>
      <div className="flex gap-2">
        {label && <label htmlFor={name}>{label}</label>}
        <input
          type="checkbox"
          className="rounded-sm border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 indeterminate:border-indigo-600 indeterminate:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
          id={name}
          {...field}
          {...restProps}
          checked={!field.value}
        />
      </div>
      <Feedback {...fieldState} />
    </div>
  );
};
