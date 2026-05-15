export type SettingsAppearanceMode = "auto" | "dark" | "light";
export type SettingsAppearanceFontSize = "small" | "medium" | "large";

export type SettingsAppearanceArgs = {
  mode: SettingsAppearanceMode;
  fullscreen: boolean;
};

export type Settings = {
  appearance: SettingsAppearanceArgs;
};
