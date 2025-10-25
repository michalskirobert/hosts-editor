import { useController, type FieldValues } from "react-hook-form";
import type { CustomTextareaProps } from "./types";
import { Feedback } from "./Feedback";
import { Textarea } from "@material-tailwind/react";

export const CustomTextarea = <T extends FieldValues>({
  control,
  name,
  label,
  ...restProps
}: CustomTextareaProps<T>) => {
  const { field, fieldState } = useController({ name, control });
  return (
    <div className="w-full">
      {label && <label htmlFor={name}>{label}</label>}
      <Textarea id={name} {...restProps} {...field} />
      <Feedback {...fieldState} />
    </div>
  );
};
