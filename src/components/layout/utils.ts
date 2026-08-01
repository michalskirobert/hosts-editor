import type { SettingsAppearanceArgs } from "@electron/types/settings";

export const getLogoPath = ({ mode, preferred }: SettingsAppearanceArgs) => {
  const lightLogo = "./header_logo.png";
  const darkLogo = "./header_logo.png";

  const resolvedMode = mode === "auto" ? preferred : mode;

  return resolvedMode === "dark" ? darkLogo : lightLogo;
};
