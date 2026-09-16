import type { BackupInfo, BackupSnapshot, HostTab } from "../../../shared/types";

export type DialogState =
  | { readonly kind: "none" }
  | { readonly kind: "import"; readonly tab: HostTab }
  | { readonly kind: "delete-tab"; readonly tab: HostTab; readonly deleteBackups: boolean }
  | { readonly kind: "delete-backup"; readonly backup: BackupInfo }
  | { readonly kind: "restore"; readonly backup: BackupInfo }
  | { readonly kind: "preview"; readonly snapshot: BackupSnapshot };
