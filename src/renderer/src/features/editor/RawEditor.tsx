import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";

interface RawEditorProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
}

export const RawEditor = ({ value, onChange }: RawEditorProps) => {
  const [find, setFind] = useState("");
  const [cursor, setCursor] = useState(0);
  const ref = useRef<HTMLTextAreaElement>(null);
  const matches = useMemo(() => {
    if (!find) return [];
    const indexes: number[] = [];
    const haystack = value.toLowerCase();
    const needle = find.toLowerCase();
    let position = 0;
    while ((position = haystack.indexOf(needle, position)) >= 0) {
      indexes.push(position);
      position += Math.max(1, needle.length);
    }
    return indexes;
  }, [value, find]);

  const jump = (delta: number): void => {
    if (!matches.length) return;
    const next = (cursor + delta + matches.length) % matches.length;
    setCursor(next);
    const start = matches[next];
    if (start !== undefined) {
      ref.current?.focus();
      ref.current?.setSelectionRange(start, start + find.length);
    }
  };

  return (
    <div className="relative h-full min-h-[560px] overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#0f1622]">
      <div className="absolute right-4 top-4 z-10 flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-[#151e2c]">
        <Search size={15} className="ml-2 text-slate-400" />
        <input
          value={find}
          onChange={(event) => {
            setFind(event.target.value);
            setCursor(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              jump(event.shiftKey ? -1 : 1);
            }
          }}
          placeholder="Find in hosts…"
          className="w-48 bg-transparent px-2 py-1.5 text-sm outline-none"
        />
        <span className="min-w-12 text-center text-xs text-slate-400">
          {matches.length ? `${String(cursor + 1)}/${String(matches.length)}` : "0/0"}
        </span>
        <button
          type="button"
          onClick={() => {
            jump(-1);
          }}
          className="p-1"
        >
          <ChevronUp size={15} />
        </button>
        <button
          type="button"
          onClick={() => {
            jump(1);
          }}
          className="p-1"
        >
          <ChevronDown size={15} />
        </button>
        <button
          type="button"
          onClick={() => {
            setFind("");
          }}
          className="p-1"
        >
          <X size={15} />
        </button>
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        spellCheck={false}
        className="mono scroll h-full min-h-[560px] w-full resize-none bg-transparent p-5 pt-16 text-[13px] leading-6 outline-none"
      />
    </div>
  );
};
