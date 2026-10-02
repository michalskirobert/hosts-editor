import { serializeLines } from "../../../shared/domain/hosts";
import type { HostTab } from "../../../shared/types";

// Dirty state must represent only data that changes the generated system hosts file.
// Parser-generated line IDs, timestamps, tab names and editor view state are UI/storage
// metadata and must never make a tab dirty. Using the serialized hosts payload also makes
// Objects -> Text -> Objects a stable round-trip when the user has not edited anything.
export const tabFingerprint = (tab: HostTab): string =>
  JSON.stringify({ enabled: tab.enabled, hosts: serializeLines(tab.lines) });
