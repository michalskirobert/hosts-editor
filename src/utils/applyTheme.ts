import type { SettingsAppearanceMode } from "@electron/types/settings";

export const applyTheme = (theme: SettingsAppearanceMode) => {
  const root = document.documentElement;

  root.classList.remove("dark");

  if (theme === "dark") {
    root.classList.add("dark");
    return;
  }

  if (theme === "auto") {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (isDark) {
      root.classList.add("dark");
    }
  }
};
