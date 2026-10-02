import { Trash2 } from "lucide-react";

import { areValidHostnames, isValidIpAddress } from "../../../../shared/domain/hosts";
import type { HostLine } from "../../../../shared/types";
import { IconButton } from "@renderer/components/ui/IconButton";
import { Input, Toggle } from "@renderer/components/shared/form";

interface StructuredEditorProps {
  readonly lines: readonly HostLine[];
  readonly query: string;
  readonly onChange: (lines: readonly HostLine[]) => void;
}

export const StructuredEditor = ({ lines, query, onChange }: StructuredEditorProps) => {
  const normalizedQuery = query.toLowerCase();
  const patch = (id: string, value: Partial<HostLine>): void => {
    onChange(lines.map((line) => (line.id === id ? { ...line, ...value } : line)));
  };
  const visible = lines.filter(
    (line) =>
      !normalizedQuery ||
      `${line.address} ${line.hostname} ${line.comment} ${line.raw}`
        .toLowerCase()
        .includes(normalizedQuery),
  );

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-300/65 bg-white/62 shadow-[0_18px_60px_-34px_rgba(15,23,42,0.38)] backdrop-blur-2xl dark:border-white/[0.09] dark:bg-slate-950/34">
      {visible.map((line) =>
        line.kind === "host" ? (
          <div
            key={line.id}
            data-host-id={line.id}
            className="grid grid-cols-[54px_160px_1fr_1fr_44px] items-center gap-3 border-b border-slate-200/45 px-4 py-2 transition-all duration-200 hover:bg-white/72 hover:shadow-[inset_3px_0_0_rgba(245,158,11,0.28)] dark:border-white/[0.045] dark:hover:bg-white/[0.025]"
          >
            <Toggle
              checked={line.enabled}
              label={line.enabled ? "Disable host" : "Enable host"}
              onChange={(enabled) => {
                patch(line.id, { enabled });
              }}
            />
            <Input
              monospace
              invalid={!isValidIpAddress(line.address)}
              title={isValidIpAddress(line.address) ? undefined : "Invalid IP address"}
              value={line.address}
              onChange={(event) => {
                patch(line.id, { address: event.target.value });
              }}
              className="border-transparent bg-transparent shadow-none hover:bg-white/85 dark:hover:bg-white/[0.055]"
            />
            <Input
              monospace
              invalid={!areValidHostnames(line.hostname)}
              data-hostname-input
              title={areValidHostnames(line.hostname) ? undefined : "Invalid hostname"}
              value={line.hostname}
              onChange={(event) => {
                patch(line.id, { hostname: event.target.value });
              }}
              className="border-transparent bg-transparent shadow-none hover:bg-white/85 dark:hover:bg-white/[0.055]"
            />
            <Input
              value={line.comment}
              onChange={(event) => {
                patch(line.id, { comment: event.target.value });
              }}
              placeholder="Comment"
              className="border-transparent bg-transparent text-slate-500 shadow-none hover:bg-white/85 dark:hover:bg-white/[0.055]"
            />
            <IconButton
              label="Delete host"
              danger
              onClick={() => {
                onChange(lines.filter((item) => item.id !== line.id));
              }}
            >
              <Trash2 size={16} />
            </IconButton>
          </div>
        ) : (
          <div
            key={line.id}
            className="border-b border-slate-200/45 px-5 py-2 text-xs italic text-slate-400 dark:border-white/[0.045]"
          >
            {line.raw || " "}
          </div>
        ),
      )}
    </div>
  );
};
