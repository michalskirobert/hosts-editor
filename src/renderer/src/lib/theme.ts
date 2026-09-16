import type { AppSettings } from "../../../shared/types";

export const applyTheme = (theme: AppSettings["theme"]): void => {
  const dark =
    theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
};
