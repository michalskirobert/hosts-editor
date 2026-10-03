import { ChevronDown, ChevronUp, FileCode2, Import, Plus, Search, Table2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { parseHostsText } from "../../../../shared/domain/hosts";
import { Input } from "../../components/shared/form";
import { Button } from "../../components/ui/Button";
import { IconButton } from "../../components/ui/IconButton";
import { ModeButton } from "../../components/ui/ModeButton";
import { useHostsEditorContext } from "@renderer/context/useHostsEditorContext";
import { RawEditor } from "./RawEditor";
import { StructuredEditor } from "./StructuredEditor";

export const EditorPage = () => {
  const { state, tab, patchState, createTab, importIntoCurrent, switchMode, setLines } =
    useHostsEditorContext();
  const [rawMatchIndex, setRawMatchIndex] = useState(0);

  const rawMatches = useMemo(() => {
    if (state.mode !== "raw" || !state.query) return [];

    const indexes: number[] = [];
    const haystack = state.raw.toLocaleLowerCase();
    const needle = state.query.toLocaleLowerCase();
    let position = 0;

    while ((position = haystack.indexOf(needle, position)) >= 0) {
      indexes.push(position);
      position += Math.max(1, needle.length);
    }

    return indexes;
  }, [state.mode, state.query, state.raw]);

  useEffect(() => {
    setRawMatchIndex(0);
  }, [state.query, state.mode]);

  const jumpRawMatch = (delta: number): void => {
    if (!rawMatches.length) return;
    setRawMatchIndex((current) => (current + delta + rawMatches.length) % rawMatches.length);
  };

  if (!tab) {
    return (
      <div className="mx-auto mt-24 max-w-lg rounded-[30px] border border-white/70 bg-white/58 p-10 text-center shadow-[0_24px_70px_-38px_rgba(15,23,42,0.45)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/42">
        <FileCode2 size={38} className="mx-auto mb-5 text-slate-400" />
        <h2 className="text-xl font-semibold">No host tabs yet</h2>
        <p className="mt-2 text-sm text-slate-400">
          Keep projects isolated in tabs, then save them to your system hosts file.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button
            onClick={() => {
              void importIntoCurrent();
            }}
            icon={<Import size={15} />}
          >
            Import system hosts
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              void createTab();
            }}
            icon={<Plus size={15} />}
          >
            Create empty tab
          </Button>
        </div>
      </div>
    );
  }

  const rawSearchActive = state.mode === "raw" && Boolean(state.query);
  const displayedMatchIndex = rawMatches.length ? (rawMatchIndex % rawMatches.length) + 1 : 0;

  return (
    <div className="mx-auto max-w-6xl pb-6 pt-6">
      <div className="sticky top-0 z-30 -mx-1 mb-4 flex h-14 items-center gap-3 px-1">
        <div className="relative h-10 min-w-0 flex-1">
          <Search
            size={17}
            className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400"
          />
          <Input
            value={state.query}
            onChange={(event) => {
              patchState({ query: event.target.value });
            }}
            onKeyDown={(event) => {
              if (state.mode !== "raw" || event.key !== "Enter") return;
              event.preventDefault();
              event.stopPropagation();
              jumpRawMatch(event.shiftKey ? -1 : 1);
            }}
            placeholder={state.mode === "raw" ? "Find in hosts…" : "Search hosts…"}
            className={`h-10 rounded-xl border-slate-300/70 bg-white/58 py-0 pl-11 shadow-[0_8px_24px_-20px_rgba(15,23,42,0.35)] hover:bg-white/62 dark:border-white/[0.075] dark:bg-white/[0.04] dark:hover:bg-white/[0.055] ${rawSearchActive ? "pr-40" : "pr-11"}`}
          />
          {rawSearchActive ? (
            <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
              <span className="min-w-12 px-1 text-center text-xs tabular-nums text-slate-500 dark:text-slate-400">
                {String(displayedMatchIndex)}/{String(rawMatches.length)}
              </span>
              <IconButton
                label="Previous match"
                className="p-1.5"
                disabled={!rawMatches.length}
                onClick={() => {
                  jumpRawMatch(-1);
                }}
              >
                <ChevronUp size={15} />
              </IconButton>
              <IconButton
                label="Next match"
                className="p-1.5"
                disabled={!rawMatches.length}
                onClick={() => {
                  jumpRawMatch(1);
                }}
              >
                <ChevronDown size={15} />
              </IconButton>
              <IconButton
                label="Clear search"
                className="p-1.5"
                onClick={() => {
                  patchState({ query: "" });
                }}
              >
                <X size={15} />
              </IconButton>
            </div>
          ) : state.query ? (
            <IconButton
              label="Clear search"
              onClick={() => {
                patchState({ query: "" });
              }}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400"
            >
              <X size={15} />
            </IconButton>
          ) : null}
        </div>
        <Button
          className="h-10"
          onClick={() => {
            patchState({ dialog: { kind: "add-hosts" } });
          }}
          icon={<Plus size={15} />}
        >
          Add hosts
        </Button>
        <div className="flex h-10 items-center rounded-xl border border-slate-300/70 bg-white/58 p-1 shadow-sm backdrop-blur-xl dark:border-white/[0.075] dark:bg-white/[0.04]">
          <ModeButton
            active={state.mode === "structured"}
            icon={<Table2 size={15} />}
            label="Objects"
            onClick={() => {
              switchMode("structured");
            }}
          />
          <ModeButton
            active={state.mode === "raw"}
            icon={<FileCode2 size={15} />}
            label="Text"
            onClick={() => {
              switchMode("raw");
            }}
          />
        </div>
      </div>

      <div className="pt-1">
        {state.mode === "structured" ? (
          <StructuredEditor lines={tab.lines} query={state.query} onChange={setLines} />
        ) : (
          <RawEditor
            value={state.raw}
            query={state.query}
            activeMatchIndex={rawMatchIndex}
            onChange={(raw) => {
              patchState({ raw });
              setLines(parseHostsText(raw));
            }}
          />
        )}
      </div>
    </div>
  );
};
