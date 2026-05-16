import { useController, type FieldValues } from "react-hook-form";
import type { CustomCheckboxProps } from "./types";
import { Feedback } from "./Feedback";
import clsx from "clsx";

export const CustomCheckbox = <T extends FieldValues>({
  control,
  name,
  label,
  icon,
  className,
  disabled,
  ...restProps
}: CustomCheckboxProps<T>) => {
  const { field, fieldState } = useController({ name, control });

  return (
    <div className="space-y-2">
      <label
        htmlFor={name}
        className={clsx(
          `
            group inline-flex cursor-pointer items-center gap-3
            rounded-xl bg-white dark:bg-zinc-900 px-1 py-1
            transition-all duration-200
            hover:bg-zinc-50 dark:hover:bg-zinc-800/60
          `,
          fieldState.invalid && "text-red-500 dark:text-red-400",
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
      >
        <input
          id={name}
          type="checkbox"
          checked={!!field.value}
          disabled={disabled}
          onChange={(e) => field.onChange(e.currentTarget.checked)}
          className="peer sr-only"
          {...restProps}
        />

        <div
          className={clsx(
            `
              relative flex h-6 w-6 items-center justify-center
              rounded-lg border border-zinc-300 dark:border-zinc-700
              bg-white dark:bg-zinc-900
              transition-all duration-200
              group-hover:border-zinc-400 dark:group-hover:border-zinc-600
              peer-checked:border-zinc-700 dark:peer-checked:border-zinc-300
              peer-checked:bg-zinc-900 dark:peer-checked:bg-zinc-100
              peer-checked:text-white
              peer-checked:shadow-sm
            `,
            fieldState.invalid &&
              "peer-checked:border-red-400 dark:peer-checked:border-red-400 peer-checked:bg-red-500/90 dark:peer-checked:bg-red-500/90",
          )}
        >
          <span className="flex items-center justify-center text-zinc-100 dark:text-zinc-900 transition-all duration-200">
            {icon ? (
              <span className="flex h-4 w-4 items-center justify-center [&>svg]:h-4 [&>svg]:w-4">
                {icon}
              </span>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path
                  fillRule="evenodd"
                  d="M16.704 5.29a1 1 0 010 1.42l-7.2 7.2a1 1 0 01-1.415 0l-3.2-3.2a1 1 0 111.414-1.42l2.493 2.494 6.493-6.494a1 1 0 011.415 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </span>
        </div>

        {label && (
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {label}
          </span>
        )}
      </label>

      <Feedback {...fieldState} />
    </div>
  );
};
