import { Trash2 } from "lucide-react";

import type { HostLine } from "../../../../shared/types";

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
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#0f1622]">
      {visible.map((line) =>
        line.kind === "host" ? (
          <div
            key={line.id}
            data-host-id={line.id}
            className="grid grid-cols-[54px_160px_1fr_1fr_44px] items-center gap-3 border-b border-slate-100 px-4 py-2 dark:border-white/6"
          >
            <button
              type="button"
              onClick={() => {
                patch(line.id, { enabled: !line.enabled });
              }}
              className={`h-6 w-11 rounded-full p-1 ${line.enabled ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"}`}
            >
              <span
                className={`block h-4 w-4 rounded-full bg-white transition ${line.enabled ? "translate-x-5" : ""}`}
              />
            </button>
            <input
              className="mono rounded-lg bg-transparent px-2 py-2 text-sm hover:bg-slate-50 dark:hover:bg-white/5"
              value={line.address}
              onChange={(event) => {
                patch(line.id, { address: event.target.value });
              }}
            />
            <input
              data-hostname-input
              className="mono rounded-lg bg-transparent px-2 py-2 text-sm hover:bg-slate-50 dark:hover:bg-white/5"
              value={line.hostname}
              onChange={(event) => {
                patch(line.id, { hostname: event.target.value });
              }}
            />
            <input
              className="rounded-lg bg-transparent px-2 py-2 text-sm text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5"
              value={line.comment}
              onChange={(event) => {
                patch(line.id, { comment: event.target.value });
              }}
              placeholder="Comment"
            />
            <button
              type="button"
              onClick={() => {
                onChange(lines.filter((item) => item.id !== line.id));
              }}
              className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ) : (
          <div
            key={line.id}
            className="border-b border-slate-100 px-5 py-2 text-xs italic text-slate-400 dark:border-white/6"
          >
            {line.raw || " "}
          </div>
        ),
      )}
    </div>
  );
};
