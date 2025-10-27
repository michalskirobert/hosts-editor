import type { HostLine } from "@utils/isHostLine";

export const processLines = (lines: string[]): HostLine[] => {
  return lines.map((line, index) => {
    const trimmed = line.trim();

    if (trimmed === "") {
      return { id: index, ip: "", domain: "", commented: false, isHost: false };
    }

    const isCommented = trimmed.startsWith("#");
    const content = isCommented ? trimmed.slice(1).trim() : trimmed;

    const parts = content.split(/\s+/);
    const [ip, ...domains] = parts;

    const isHost =
      !!ip && !!domains.length && /^\d{1,3}(\.\d{1,3}){3}$/.test(ip);

    return {
      id: index,
      ip: isHost ? ip : "",
      domain: isHost ? domains.join(" ") : content,
      commented: isCommented,
      isHost,
      raw: line,
    };
  });
};

export const processLinesToSave = (hosts: HostLine[]): string[] => {
  return hosts.map(({ ip, domain, commented }) => {
    let line = ip && domain ? `${ip} ${domain}` : domain || ip;
    if (commented && line.trim() !== "") line = `# ${line}`;
    return line;
  });
};
