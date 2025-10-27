import type { InputProps } from "@material-tailwind/react/components/Input";
import type { CheckboxProps } from "@material-tailwind/react/components/Checkbox";
import type { TextareaProps } from "@material-tailwind/react/components/Textarea";
import type { Control, FieldValues, Path } from "react-hook-form";
import type { Ref } from "react";

export type CommonProps<T extends FieldValues> = {
  name: Path<T>;
  control: Control<T>;
  label?: string;
  ref?: Ref<HTMLInputElement>;
};

export type CustomInputProps<T extends FieldValues> = CommonProps<T> &
  Omit<InputProps, "name" | "crossOrigin" | "Ref">;

export type CustomCheckboxProps<T extends FieldValues> = CommonProps<T> &
  Omit<CheckboxProps, "name" | "crossOrigin" | "Ref">;

export type CustomTextareaProps<T extends FieldValues> = CommonProps<T> &
  Omit<TextareaProps, "name" | "crossOrigin" | "Ref">;
