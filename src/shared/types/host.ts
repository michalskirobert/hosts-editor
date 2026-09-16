export type HostLineKind = "host" | "comment" | "blank" | "raw";

export interface HostLine {
  readonly id: string;
  readonly kind: HostLineKind;
  readonly enabled: boolean;
  readonly address: string;
  readonly hostname: string;
  readonly comment: string;
  readonly raw: string;
}

export interface HostTab {
  readonly id: string;
  readonly name: string;
  readonly enabled: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lines: readonly HostLine[];
}
