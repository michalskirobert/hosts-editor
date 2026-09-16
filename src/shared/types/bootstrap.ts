import type { AppSettings } from "./settings";
import type { HostTab } from "./host";

export interface BootstrapPayload {
  readonly tabs: readonly HostTab[];
  readonly settings: AppSettings;
  readonly hostsPath: string;
  readonly version: string;
}
