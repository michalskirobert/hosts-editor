import { useController, type FieldValues } from "react-hook-form";
import type { CustomInputProps } from "./types";
import { Feedback } from "./Feedback";
import { Input } from "@material-tailwind/react";

export const CustomInput = <T extends FieldValues>({
  control,
  name,
  ...restProps
}: CustomInputProps<T>) => {
  const { field, fieldState } = useController({ name, control });
  return (
    <div className="w-full">
      <Input
        id={name}
        {...restProps}
        {...field}
        className={`${restProps?.className || ""} dark:!text-white`}
        type={restProps.type ? restProps.type : "text"}
        inputRef={field.ref}
      />
      <Feedback {...fieldState} />
    </div>
  );
};
