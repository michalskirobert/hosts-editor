import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { Input, Textarea } from "@renderer/components/shared/form";
import { IconButton } from "@renderer/components/ui/IconButton";
import { ScrollArea } from "@renderer/components/ui/ScrollArea";

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
    <div className="relative h-full min-h-[560px] overflow-hidden rounded-3xl border border-white/70 bg-white/55 shadow-[0_18px_60px_-34px_rgba(15,23,42,0.4)] backdrop-blur-2xl dark:border-white/[0.09] dark:bg-slate-950/42">
      <div className="absolute right-4 top-4 z-10 flex items-center gap-1 rounded-2xl border border-white/75 bg-white/72 p-1 shadow-lg backdrop-blur-2xl dark:border-white/10 dark:bg-[#0b111b]/75">
        <Search size={16} className="ml-2 text-slate-400" />
        <Input
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
          className="w-48 border-transparent bg-transparent px-2 py-1.5 shadow-none hover:bg-white/40 focus:bg-white/50 dark:bg-transparent dark:hover:bg-white/[0.035] dark:focus:bg-white/[0.05]"
        />
        <span className="min-w-12 text-center text-xs text-slate-400">
          {matches.length ? `${String(cursor + 1)}/${String(matches.length)}` : "0/0"}
        </span>
        <IconButton
          label="Previous match"
          className="p-1.5"
          onClick={() => {
            jump(-1);
          }}
        >
          <ChevronUp size={15} />
        </IconButton>
        <IconButton
          label="Next match"
          className="p-1.5"
          onClick={() => {
            jump(1);
          }}
        >
          <ChevronDown size={15} />
        </IconButton>
        <IconButton
          label="Clear search"
          className="p-1.5"
          onClick={() => {
            setFind("");
          }}
        >
          <X size={15} />
        </IconButton>
      </div>
      <ScrollArea className="absolute inset-0">
        <Textarea
          ref={ref}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          spellCheck={false}
          monospace
          className="h-full min-h-[560px] w-full resize-none rounded-none border-0 bg-transparent p-5 pt-16 text-[13px] leading-6 shadow-none hover:bg-transparent focus:bg-transparent focus:ring-0 dark:bg-transparent dark:hover:bg-transparent dark:focus:bg-transparent"
        />
      </ScrollArea>
    </div>
  );
};
