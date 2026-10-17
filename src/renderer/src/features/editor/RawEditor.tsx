import { useLayoutEffect, useMemo, useRef } from "react";
import type { CSSProperties } from "react";

import type { TextMatch } from "../../lib/search";

interface RawEditorProps {
  readonly value: string;
  readonly matches: readonly TextMatch[];
  readonly activeMatchIndex: number;
  readonly onChange: (value: string) => void;
}

const textStyle: CSSProperties = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
  fontSize: "13px",
  fontWeight: 400,
  fontStyle: "normal",
  fontVariantLigatures: "none",
  letterSpacing: "normal",
  lineHeight: "24px",
  tabSize: 4,
  padding: "20px",
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
  wordBreak: "normal",
  textAlign: "left",
  textIndent: 0,
  textTransform: "none",
  boxSizing: "border-box",
  border: 0,
};

export const RawEditor = ({ value, matches, activeMatchIndex, onChange }: RawEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const normalizedIndex = matches.length ? activeMatchIndex % matches.length : -1;

  const parts = useMemo(() => {
    let cursor = 0;
    const result = matches.flatMap((match, index) => {
      const before = value.slice(cursor, match.start);
      cursor = match.end;
      return [
        before,
        <mark
          key={index}
          data-match={index}
          className={
            index === normalizedIndex
              ? "bg-amber-400/85 text-transparent outline outline-1 outline-amber-600 dark:bg-amber-300/60"
              : "bg-amber-300/50 text-transparent dark:bg-amber-300/30"
          }
        >
          {value.slice(match.start, match.end)}
        </mark>,
      ];
    });
    result.push(value.slice(cursor), "\u200b");
    return result;
  }, [matches, normalizedIndex, value]);

  const syncScroll = (): void => {
    const textarea = textareaRef.current;
    const viewport = viewportRef.current;
    if (!textarea || !viewport) return;
    viewport.scrollTop = textarea.scrollTop;
    viewport.scrollLeft = textarea.scrollLeft;
  };

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    const mirror = mirrorRef.current;
    const viewport = viewportRef.current;
    if (!textarea || !mirror || !viewport) return;
    const sync = (): void => {
      mirror.style.width = `${String(textarea.clientWidth)}px`;
      viewport.style.width = `${String(textarea.clientWidth)}px`;
      viewport.style.height = `${String(textarea.clientHeight)}px`;
      syncScroll();
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(textarea);
    return () => {
      observer.disconnect();
    };
  }, []);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    const mirror = mirrorRef.current;
    const active = mirror?.querySelector<HTMLElement>(`[data-match="${String(normalizedIndex)}"]`);
    if (!textarea || !mirror || !active) {
      syncScroll();
      return;
    }
    const rect = active.getBoundingClientRect();
    const bounds = mirror.getBoundingClientRect();
    const top = rect.top - bounds.top;
    if (
      top < textarea.scrollTop + 20 ||
      top + rect.height > textarea.scrollTop + textarea.clientHeight - 20
    ) {
      textarea.scrollTop = Math.max(0, top - textarea.clientHeight / 3);
    }
    syncScroll();
  }, [normalizedIndex, matches, value]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-300/70 bg-white/75 shadow-[0_18px_60px_-34px_rgba(15,23,42,0.4)] backdrop-blur-2xl focus-within:ring-2 focus-within:ring-amber-500/30 dark:border-white/10 dark:bg-slate-950/55">
      <div
        ref={viewportRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 overflow-hidden"
      >
        <div ref={mirrorRef} style={textStyle} className="min-h-full text-transparent">
          {parts}
        </div>
      </div>
      <textarea
        ref={textareaRef}
        aria-label="Hosts file text"
        value={value}
        wrap="soft"
        style={textStyle}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        onScroll={syncScroll}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        className="relative block h-[560px] w-full resize-none overflow-auto bg-transparent text-slate-900 outline-none [scrollbar-gutter:stable] dark:text-slate-100"
      />
    </div>
  );
};
