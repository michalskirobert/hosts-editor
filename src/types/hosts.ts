import type { HostLine } from "@utils/isHostLine";

export type HostsArgs = {
  lines: HostLine[];
  text: string;
};

export type LoadersArgs = Record<"saving" | "searching", boolean>;
export type ModalsArgs = Record<"add" | "settings", boolean>;
