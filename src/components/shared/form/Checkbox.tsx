import { useController, type FieldValues } from "react-hook-form";
import type { CustomCheckboxProps } from "./types";
import { Feedback } from "./Feedback";
import { Checkbox } from "@material-tailwind/react";

export const CustomCheckbox = <T extends FieldValues>({
  control,
  name,
  ...restProps
}: CustomCheckboxProps<T>) => {
  const { field, fieldState } = useController({ name, control });

  return (
    <div>
      <Checkbox
        id={name}
        crossOrigin={undefined}
        {...restProps}
        checked={field.value}
        className={`${restProps?.className || ""}`}
        onChange={(e) => field.onChange(e.currentTarget.checked)}
      />
      <Feedback {...fieldState} />
    </div>
  );
};
