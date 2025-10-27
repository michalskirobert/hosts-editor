export type SettingsAppearanceMode = "auto" | "dark" | "light";
export type SettingsAppearanceFontSize = "small" | "medium" | "large";

export type SettingsAppearanceArgs = {
  mode: SettingsAppearanceMode;
  fontSize: SettingsAppearanceFontSize;
};

export type Settings = {
  rememberCurrentUser: boolean;
  appearance: SettingsAppearanceArgs;
};
