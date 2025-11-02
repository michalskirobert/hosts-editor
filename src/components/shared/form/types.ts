import type { InputProps } from "@material-tailwind/react/components/Input";
import type { CheckboxProps } from "@material-tailwind/react/components/Checkbox";
import type { Control, FieldValues, Path } from "react-hook-form";
import type { Ref } from "react";
import type { TextareaProps } from "@material-tailwind/react/components/Textarea";
import type { HWTAProps } from "react-highlight-within-textarea/lib/esm/HighlightWithinTextarea";

export type CommonProps<T extends FieldValues> = {
  name: Path<T>;
  control: Control<T>;
  label?: string;
};

export type CustomInputProps<T extends FieldValues> = CommonProps<T> &
  Omit<InputProps, "name" | "crossOrigin" | "ref"> & {
    ref?: Ref<HTMLInputElement>;
  };

export type CustomCheckboxProps<T extends FieldValues> = CommonProps<T> &
  Omit<CheckboxProps, "name" | "crossOrigin" | "ref"> & {
    ref?: Ref<HTMLInputElement>;
  };

export type CustomHighlightWithinTextareaProps<T extends FieldValues> =
  CommonProps<T> & Omit<HWTAProps, "value">;

export type CustomTextareaProps<T extends FieldValues> = CommonProps<T> &
  Omit<TextareaProps, "name" | "crossOrigin" | "Ref">;
