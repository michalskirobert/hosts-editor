export type SettingsAppearanceMode = "auto" | "dark" | "light";
export type SettingsAppearanceFontSize = "small" | "medium" | "large";

export type SettingsAppearanceArgs = {
  mode: SettingsAppearanceMode;
  preferred: Exclude<SettingsAppearanceMode, "auto">;
  fullscreen: boolean;
};

export type Settings = {
  appearance: SettingsAppearanceArgs;
};
