import type { HostTab } from "../../../shared/types";

export const tabFingerprint = (tab: HostTab): string =>
  JSON.stringify({ name: tab.name, enabled: tab.enabled, lines: tab.lines });
