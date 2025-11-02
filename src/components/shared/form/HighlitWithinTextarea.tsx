import { useController, type FieldValues } from "react-hook-form";
import type { CustomHighlightWithinTextareaProps } from "./types";
import HighlightWithinTextarea from "react-highlight-within-textarea";

export const HighlightWithinTextareaComponent = <T extends FieldValues>({
  control,
  name,
  highlight,
  label,
  ...restProps
}: CustomHighlightWithinTextareaProps<T> & { highlight?: string }) => {
  const { field } = useController({ name, control });

  return (
    <HighlightWithinTextarea
      highlight={highlight ? new RegExp(highlight, "gi") : undefined}
      placeholder={restProps?.placeholder}
      {...restProps}
      value={String(field.value ?? "")}
      onChange={(nextValue: string) => field.onChange(nextValue)}
    />
  );
};
