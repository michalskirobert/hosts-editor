import type { SettingsAppearanceArgs } from "@electron/types/settings";

export const getLogoPath = ({ mode, preferred }: SettingsAppearanceArgs) => {
  const lightLogo = "./header_logo.jpg";
  const darkLogo = "./header_logo_dark.jpg";

  const resolvedMode = mode === "auto" ? preferred : mode;

  return resolvedMode === "dark" ? darkLogo : lightLogo;
};
