export interface HostLine {
  id: number;
  line: string;
  commented: boolean;
  isHost: boolean;
}

export const isHostLine = (line: string) => {
  const trimmed = line.trim().replace(/^#\s*/, "");
  if (!trimmed) return false;

  return /^\d{1,3}(\.\d{1,3}){3}\s+\S+/.test(trimmed);
};
