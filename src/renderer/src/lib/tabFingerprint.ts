import type { HostTab } from "../../../shared/types";

// Tracks only data that affects the generated system hosts file.
// Tab names and timestamps are JSON metadata and must not mark HOSTS as stale.
export const tabFingerprint = (tab: HostTab): string =>
  JSON.stringify({ enabled: tab.enabled, lines: tab.lines });
