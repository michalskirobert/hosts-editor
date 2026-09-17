import type { HostLine } from "../types";

const ipv4 = /^(?:\d{1,3}\.){3}\d{1,3}$/;
const ipv6 = /^(?:[0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

const createLine = (
  raw: string,
  kind: HostLine["kind"],
  overrides: Partial<Omit<HostLine, "id" | "kind" | "raw">> = {},
): HostLine => ({
  id: globalThis.crypto.randomUUID(),
  kind,
  enabled: true,
  address: "",
  hostname: "",
  comment: "",
  raw,
  ...overrides,
});

export const parseHostsText = (text: string): readonly HostLine[] =>
  text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((raw) => {
      const trimmed = raw.trim();

      if (!trimmed) {
        return createLine(raw, "blank");
      }

      const commented = trimmed.startsWith("#");
      const body = (commented ? trimmed.slice(1) : trimmed).trim();

      const hash = body.indexOf("#");
      const mapping = (hash >= 0 ? body.slice(0, hash) : body).trim();
      const comment = (hash >= 0 ? body.slice(hash + 1) : "").trim();

      const parts = mapping.split(/\s+/).filter(Boolean);
      const address = parts[0] ?? "";
      const hostname = parts.slice(1).join(" ");

      if ((ipv4.test(address) || ipv6.test(address)) && hostname) {
        return createLine(raw, "host", {
          enabled: !commented,
          address,
          hostname,
          comment,
        });
      }

      if (commented) {
        return createLine(raw, "comment");
      }

      return createLine(`# ${raw}`, "comment");
    });

export const serializeLines = (lines: readonly HostLine[]): string =>
  lines
    .map((line) => {
      if (line.kind !== "host") {
        return line.raw;
      }

      const base = `${line.address} ${line.hostname}`.trim();
      const withComment = line.comment ? `${base} # ${line.comment}` : base;

      return line.enabled ? withComment : `# ${withComment}`;
    })
    .join("\n");
