import type { DetailedHTMLProps, InputHTMLAttributes } from "react";
import type { Control, FieldValues, Path } from "react-hook-form";

export type CommonProps<T extends FieldValues> = {
  name: Path<T>;
  control: Control<T>;
  label?: string;
};

export type InputProps<T extends FieldValues> = CommonProps<T> &
  Omit<
    DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>,
    "name"
  >;

export type CheckboxProps<T extends FieldValues> = CommonProps<T> &
  Omit<
    DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>,
    "name"
  >;

export type TextareaProps<T extends FieldValues> = CommonProps<T> &
  Omit<
    DetailedHTMLProps<
      InputHTMLAttributes<HTMLTextAreaElement>,
      HTMLTextAreaElement
    >,
    "name"
  >;
