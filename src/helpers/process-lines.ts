import { isHostLine, type HostLine } from "@utils/isHostLine";

export const processLines = (host: string[]) =>
  host.map((line, idx) => ({
    id: idx,
    line: line.replace("#", ""),
    commented: line.trim().startsWith("#"),
    isHost: isHostLine(line),
  }));

export const processLinesToSave = (lines: HostLine[]) =>
  lines.map((l) =>
    l.commented ? `#${l.line.replace(/^#/, "")}` : l.line.replace(/^#/, "")
  );
