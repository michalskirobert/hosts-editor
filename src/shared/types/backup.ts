import type { HostTab } from "./host";

export type BackupReason = "auto-save" | "manual" | "pre-restore" | "pre-import" | "pre-delete";

export interface BackupInfo {
  readonly tabId: string;
  readonly fileName: string;
  readonly createdAt: string;
  readonly path: string;
  readonly reason: BackupReason;
}

export interface BackupSnapshot {
  readonly info: BackupInfo;
  readonly tab: HostTab;
}
