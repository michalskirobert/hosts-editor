export interface UpdateState {
  readonly status:
    | "idle"
    | "checking"
    | "available"
    | "current"
    | "downloading"
    | "downloaded"
    | "opening"
    | "handoff"
    | "installing"
    | "error"
    | "cancelled";
  readonly noticePending?: boolean;
  readonly origin?: "startup" | "manual";
  readonly revision?: number;
  readonly handoffSupported?: boolean;
  readonly currentVersion?: string;
  readonly version?: string;
  readonly message?: string;
  readonly releaseUrl?: string;
  readonly downloadUrl?: string;
  readonly installSupported?: boolean;
  readonly packageType?: string | undefined;
  readonly progress?:
    | {
        readonly percent: number;
        readonly transferred: number;
        readonly total: number;
      }
    | undefined;
}
