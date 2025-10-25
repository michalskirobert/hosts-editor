import type { InputProps } from "@material-tailwind/react/components/Input";
import type { CheckboxProps } from "@material-tailwind/react/components/Checkbox";
import type { TextareaProps } from "@material-tailwind/react/components/Textarea";
import type { Control, FieldValues, Path } from "react-hook-form";

export type CommonProps<T extends FieldValues> = {
  name: Path<T>;
  control: Control<T>;
  label?: string;
};

export type CustomInputProps<T extends FieldValues> = CommonProps<T> &
  Omit<InputProps, "name"> &
  any;

export type CustomCheckboxProps<T extends FieldValues> = CommonProps<T> &
  Omit<CheckboxProps, "name"> &
  any;

export type CustomTextareaProps<T extends FieldValues> = CommonProps<T> &
  Omit<TextareaProps, "name"> &
  any;
