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
    <div
      className="
    w-full h-full
    text-zinc-900 dark:text-zinc-100
  "
    >
      <HighlightWithinTextarea
        highlight={highlight ? new RegExp(highlight, "gi") : undefined}
        placeholder={restProps?.placeholder}
        {...restProps}
        value={String(field.value ?? "")}
        onChange={(nextValue: string) => field.onChange(nextValue)}
      />
    </div>
  );
};
