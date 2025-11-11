export type UpdateInfoArgs = {
  version: string;
  releaseNotes: string;
};

export type UpdateStatus =
  | "checking"
  | "available"
  | "not-available"
  | "error"
  | null;

export type UpdateEventArgs = {
  status: UpdateStatus;
  updateInfo?: UpdateInfoArgs;
  message?: string;
};
