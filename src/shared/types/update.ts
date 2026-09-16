export interface UpdateState {
  readonly status: "idle" | "checking" | "available" | "current" | "error";
  readonly version?: string;
  readonly message?: string;
  readonly releaseUrl?: string;
}
