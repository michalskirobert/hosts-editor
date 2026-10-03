import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";

import { Textarea } from "@renderer/components/shared/form";

interface RawEditorProps {
  readonly value: string;
  readonly query: string;
  readonly activeMatchIndex: number;
  readonly onChange: (value: string) => void;
}

interface HighlightPart {
  readonly text: string;
  readonly matchIndex?: number;
}

export const RawEditor = ({ value, query, activeMatchIndex, onChange }: RawEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const [editorMetrics, setEditorMetrics] = useState<CSSProperties>({});

  const matches = useMemo(() => {
    if (!query) return [];

    const indexes: number[] = [];
    const haystack = value.toLocaleLowerCase();
    const needle = query.toLocaleLowerCase();
    let position = 0;

    while ((position = haystack.indexOf(needle, position)) >= 0) {
      indexes.push(position);
      position += Math.max(1, needle.length);
    }

    return indexes;
  }, [query, value]);

  const normalizedActiveMatchIndex =
    matches.length > 0
      ? ((activeMatchIndex % matches.length) + matches.length) % matches.length
      : -1;

  const highlightParts = useMemo<HighlightPart[]>(() => {
    if (!query || !matches.length) return [{ text: value }];

    const parts: HighlightPart[] = [];
    let cursor = 0;

    matches.forEach((start, matchIndex) => {
      if (start > cursor) parts.push({ text: value.slice(cursor, start) });
      parts.push({ text: value.slice(start, start + query.length), matchIndex });
      cursor = start + query.length;
    });

    if (cursor < value.length) parts.push({ text: value.slice(cursor) });
    if (value.endsWith("\n")) parts.push({ text: "\n" });

    return parts;
  }, [matches, query, value]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const syncMetrics = (): void => {
      const style = window.getComputedStyle(textarea);
      setEditorMetrics({
        boxSizing: style.boxSizing as CSSProperties["boxSizing"],
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        fontStyle: style.fontStyle,
        letterSpacing: style.letterSpacing,
        lineHeight: style.lineHeight,
        paddingTop: style.paddingTop,
        paddingRight: style.paddingRight,
        paddingBottom: style.paddingBottom,
        paddingLeft: style.paddingLeft,
        tabSize: style.tabSize,
        width: `${String(textarea.clientWidth)}px`,
        height: `${String(textarea.clientHeight)}px`,
      });
    };

    syncMetrics();
    const observer = new ResizeObserver(syncMetrics);
    observer.observe(textarea);
    return () => {
      observer.disconnect();
    };
  }, []);

  const syncScroll = (): void => {
    const textarea = textareaRef.current;
    const highlight = highlightRef.current;
    if (!textarea || !highlight) return;

    highlight.scrollTop = textarea.scrollTop;
    highlight.scrollLeft = textarea.scrollLeft;
  };

  useEffect(() => {
    if (!query || !matches.length) return;

    const start = matches[normalizedActiveMatchIndex];
    const textarea = textareaRef.current;
    const highlight = highlightRef.current;
    if (start === undefined || !textarea) return;

    const valueBeforeMatch = value.slice(0, start);
    const line = valueBeforeMatch.split("\n").length - 1;
    const computedLineHeight = Number.parseFloat(window.getComputedStyle(textarea).lineHeight);
    const lineHeight = Number.isFinite(computedLineHeight) ? computedLineHeight : 24;
    const targetScrollTop = Math.max(0, line * lineHeight - textarea.clientHeight / 3);

    textarea.scrollTo({ top: targetScrollTop, behavior: "smooth" });
    if (highlight) highlight.scrollTop = targetScrollTop;
  }, [matches, normalizedActiveMatchIndex, query, value]);

  return (
    <div className="relative min-h-[560px] overflow-hidden rounded-3xl border border-white/70 bg-white/55 shadow-[0_18px_60px_-34px_rgba(15,23,42,0.4)] backdrop-blur-2xl dark:border-white/[0.09] dark:bg-slate-950/42">
      <div
        ref={highlightRef}
        aria-hidden="true"
        style={editorMetrics}
        className="pointer-events-none absolute left-0 top-0 overflow-hidden whitespace-pre-wrap break-words text-transparent"
      >
        {highlightParts.map((part, index) =>
          part.matchIndex === undefined ? (
            <span key={index}>{part.text}</span>
          ) : (
            <mark
              key={index}
              className={
                part.matchIndex === normalizedActiveMatchIndex
                  ? "rounded-sm bg-amber-400/80 text-transparent ring-1 ring-amber-500/70 dark:bg-amber-300/55 dark:ring-amber-300/80"
                  : "rounded-sm bg-amber-300/45 text-transparent dark:bg-amber-300/25"
              }
            >
              {part.text}
            </mark>
          ),
        )}
      </div>

      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        onScroll={syncScroll}
        spellCheck={false}
        monospace
        className="relative z-10 h-[560px] min-h-[560px] w-full resize-none rounded-none border-0 bg-transparent p-5 text-[13px] leading-6 shadow-none hover:bg-transparent focus:bg-transparent focus:ring-0 dark:bg-transparent dark:hover:bg-transparent dark:focus:bg-transparent"
      />
    </div>
  );
};
