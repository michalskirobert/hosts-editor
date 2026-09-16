export type ThemeMode = "system" | "light" | "dark";

export interface AppSettings {
  readonly theme: ThemeMode;
  readonly fullscreen: boolean;
  readonly checkForUpdates: boolean;
}
