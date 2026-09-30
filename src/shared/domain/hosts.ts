import type { HostLine } from "../types";

const ipv4Shape = /^(?:\d{1,3}\.){3}\d{1,3}$/;
const hostnameLabel = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/;

export const isValidIpv4 = (value: string): boolean => {
  if (!ipv4Shape.test(value)) return false;
  return value.split(".").every((part) => {
    if (part.length > 1 && part.startsWith("0")) return false;
    const octet = Number(part);
    return Number.isInteger(octet) && octet >= 0 && octet <= 255;
  });
};

export const isValidIpv6 = (value: string): boolean => {
  if (!value || value.includes(":::")) return false;

  const halves = value.split("::");
  if (halves.length > 2) return false;

  const parseHalf = (half: string): readonly string[] => (half ? half.split(":") : []);
  const left = parseHalf(halves[0] ?? "");
  const right = parseHalf(halves[1] ?? "");
  const parts = [...left, ...right];

  if (parts.some((part) => !/^[0-9A-Fa-f]{1,4}$/.test(part))) return false;
  return halves.length === 2 ? parts.length < 8 : parts.length === 8;
};

export const isValidIpAddress = (value: string): boolean =>
  isValidIpv4(value.trim()) || isValidIpv6(value.trim());

export const isValidHostname = (value: string): boolean => {
  const normalized = value.trim();
  if (!normalized || normalized.length > 253) return false;
  if (normalized.includes("://") || /[\s/\\?#]/.test(normalized)) return false;
  if (normalized.startsWith(".") || normalized.endsWith(".")) return false;

  return normalized.split(".").every((label) => hostnameLabel.test(label));
};

export const areValidHostnames = (value: string): boolean => {
  const hostnames = value.trim().split(/\s+/).filter(Boolean);
  return hostnames.length > 0 && hostnames.every(isValidHostname);
};

export const getHostLineError = (line: HostLine): string | undefined => {
  if (line.kind !== "host") return undefined;
  if (!isValidIpAddress(line.address)) return `Invalid IP address: ${line.address || "(empty)"}`;
  if (!areValidHostnames(line.hostname)) return `Invalid hostname: ${line.hostname || "(empty)"}`;
  return undefined;
};

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
      if (!trimmed) return createLine(raw, "blank");

      const commented = trimmed.startsWith("#");
      const body = (commented ? trimmed.slice(1) : trimmed).trim();
      const hash = body.indexOf("#");
      const mapping = (hash >= 0 ? body.slice(0, hash) : body).trim();
      const comment = (hash >= 0 ? body.slice(hash + 1) : "").trim();
      const parts = mapping.split(/\s+/).filter(Boolean);
      const address = parts[0] ?? "";
      const hostnames = parts.slice(1);

      if (isValidIpAddress(address) && hostnames.length > 0 && hostnames.every(isValidHostname)) {
        return createLine(raw, "host", {
          enabled: !commented,
          address,
          hostname: hostnames.join(" "),
          comment,
        });
      }

      if (commented) return createLine(raw, "comment");
      return createLine(`# ${raw}`, "comment");
    });

export const serializeLines = (lines: readonly HostLine[]): string =>
  lines
    .map((line) => {
      if (line.kind !== "host") return line.raw;
      const base = `${line.address} ${line.hostname}`.trim();
      const withComment = line.comment ? `${base} # ${line.comment}` : base;
      return line.enabled ? withComment : `# ${withComment}`;
    })
    .join("\n");
