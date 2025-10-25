import { useController, type FieldValues } from "react-hook-form";
import type { CustomCheckboxProps } from "./types";
import { Feedback } from "./Feedback";
import { Checkbox } from "@material-tailwind/react";

export const CustomCheckbox = <T extends FieldValues>({
  control,
  name,
  label,
  ...restProps
}: CustomCheckboxProps<T>) => {
  const { field, fieldState } = useController({ name, control });

  return (
    <div>
      <div className="flex gap-2">
        {label && <label htmlFor={name}>{label}</label>}
        <Checkbox
          id={name}
          {...restProps}
          checked={field.value}
          className={`${restProps?.className || ""}`}
          onChange={(e) => field.onChange(e.currentTarget.checked)}
        />
      </div>
      <Feedback {...fieldState} />
    </div>
  );
};
