import { useController, type FieldValues } from "react-hook-form";
import type { CustomTextareaProps } from "./types";
import { Feedback } from "./Feedback";
import { Textarea } from "@material-tailwind/react";

export const CustomTextarea = <T extends FieldValues>({
  control,
  name,
  ...restProps
}: CustomTextareaProps<T>) => {
  const { field, fieldState } = useController({ name, control });
  return (
    <div className="w-full">
      <Textarea
        id={name}
        {...restProps}
        {...field}
        className={`${restProps?.className || ""} dark:text-white`}
      />
      <Feedback {...fieldState} />
    </div>
  );
};
