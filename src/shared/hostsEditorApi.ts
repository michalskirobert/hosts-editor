import type {
  AppSettings,
  BackupInfo,
  BackupReason,
  BackupSnapshot,
  BootstrapPayload,
  FeedbackCaptchaResult,
  FeedbackSubmission,
  FeedbackSubmitResult,
  HostTab,
  UpdateState,
} from "./types";

export interface HostsEditorApi {
  bootstrap(): Promise<BootstrapPayload>;
  createTab(name: string, text: string): Promise<HostTab>;
  saveTab(tab: HostTab): Promise<HostTab>;
  deleteTab(id: string, deleteBackups: boolean): Promise<void>;
  importHosts(): Promise<string>;
  saveTabAndApply(tab: HostTab): Promise<HostTab>;
  listBackups(): Promise<readonly BackupInfo[]>;
  createBackup(tab: HostTab, reason?: BackupReason): Promise<BackupInfo>;
  readBackup(backup: BackupInfo): Promise<BackupSnapshot>;
  restoreBackup(backup: BackupInfo): Promise<HostTab>;
  deleteBackup(backup: BackupInfo): Promise<void>;
  exportBackup(backup: BackupInfo): Promise<boolean>;
  openBackups(): Promise<void>;
  saveSettings(settings: AppSettings): Promise<AppSettings>;
  checkUpdate(): Promise<UpdateState>;
  openUpdate(): Promise<void>;
  setFullscreen(value: boolean): Promise<void>;
  openExternal(url: string): Promise<void>;
  getFeedbackCaptcha(): Promise<FeedbackCaptchaResult>;
  submitFeedback(payload: FeedbackSubmission): Promise<FeedbackSubmitResult>;
}
