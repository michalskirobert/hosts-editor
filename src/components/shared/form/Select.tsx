import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { Check, NavArrowDown } from "iconoir-react";
import clsx from "clsx";
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";

export interface SelectOption {
  label: string;
  value: string;
}

interface CustomSelectProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  disabled?: boolean;
  className?: string;
}

export const CustomSelect = <T extends FieldValues>({
  control,
  name,
  label,
  placeholder = "Select option",
  options,
  disabled,
  className,
}: CustomSelectProps<T>) => {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const selectedOption = options.find(
          (option) => option.value === field.value,
        );

        return (
          <div className="w-full space-y-2">
            {label && (
              <label className="ml-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors duration-200">
                {label}
              </label>
            )}

            <Listbox
              value={field.value}
              onChange={field.onChange}
              disabled={disabled}
            >
              <div className="relative">
                <ListboxButton
                  className={clsx(
                    `
                      relative w-full rounded-xl border
                      bg-white dark:bg-zinc-900/60
                      px-4 py-3 pr-11
                      text-left text-sm text-zinc-900 dark:text-zinc-100
                      shadow-sm
                      transition-all duration-200
                      outline-none
                      hover:border-zinc-300 dark:hover:border-zinc-700
                      hover:bg-white/80 dark:hover:bg-zinc-900/80
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    `,
                    fieldState.invalid
                      ? "!border-red-500 dark:!border-red-500 focus:border-red-500 focus:shadow-[0_0_0_2px_rgba(239,68,68,0.18)]"
                      : "border-zinc-200 dark:border-zinc-800 focus:border-blue-500 focus:shadow-[0_0_0_2px_rgba(59,130,246,0.15)]",
                    className,
                  )}
                >
                  <span
                    className={clsx(
                      "block truncate",
                      !selectedOption && "text-slate-400",
                    )}
                  >
                    {selectedOption?.label || placeholder}
                  </span>

                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-zinc-400 dark:text-zinc-500">
                    <NavArrowDown className="h-4 w-4" />
                  </span>
                </ListboxButton>

                <ListboxOptions
                  anchor="bottom"
                  transition
                  className="
                    z-50 mt-2 max-h-64 w-[var(--button-width)] overflow-auto
                    rounded-2xl border border-zinc-200 dark:border-zinc-800
                    bg-white/95 dark:bg-zinc-900/95 p-1
                    shadow-[0_12px_40px_rgba(0,0,0,0.25)]
                    transition duration-150 ease-out
                    data-[closed]:scale-95
                    data-[closed]:opacity-0
                  "
                >
                  {options.map((option) => {
                    const isSelected = option.value === field.value;

                    return (
                      <ListboxOption
                        key={option.value}
                        value={option.value}
                        className="group"
                      >
                        {({ focus }) => (
                          <div
                            className={clsx(
                              `
                                flex cursor-pointer items-center justify-between
                                rounded-xl px-3 py-2.5
                                text-sm text-zinc-700 dark:text-zinc-200
                                transition-all duration-150
                              `,
                              focus &&
                                "bg-blue-500/10 text-zinc-900 dark:text-zinc-100",
                              isSelected &&
                                "font-medium text-blue-500 dark:text-blue-400",
                            )}
                          >
                            <span className="truncate">{option.label}</span>

                            {isSelected && <Check className="h-4 w-4" />}
                          </div>
                        )}
                      </ListboxOption>
                    );
                  })}
                </ListboxOptions>
              </div>
            </Listbox>

            {fieldState.error?.message && (
              <p className="ml-1 text-xs text-red-500">
                {fieldState.error.message}
              </p>
            )}
          </div>
        );
      }}
    />
  );
};
