import { FileCode2, Import, Plus, Search, Table2, X } from "lucide-react";

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

  return (
    <div className="mx-auto max-w-6xl pb-6 pt-6">
      <div className="sticky top-0 z-30 -mx-2 mb-5 flex h-[67px] items-center gap-3 border-b border-slate-300/70 bg-slate-100/92 px-2 backdrop-blur-2xl dark:border-white/[0.06] dark:bg-[#080d15]/92">
        <div className="relative h-11 min-w-0 flex-1">
          <Search
            size={17}
            className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400"
          />
          <Input
            value={state.query}
            onChange={(event) => {
              patchState({ query: event.target.value });
            }}
            placeholder="Search hosts…"
            className="h-11 rounded-2xl border-slate-300/85 bg-white/88 py-0 pl-11 pr-11 shadow-[0_8px_24px_-20px_rgba(15,23,42,0.35)] hover:bg-white/62 dark:border-white/[0.075] dark:bg-white/[0.035] dark:hover:bg-white/[0.055]"
          />
          {state.query && (
            <IconButton
              label="Clear search"
              onClick={() => {
                patchState({ query: "" });
              }}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400"
            >
              <X size={15} />
            </IconButton>
          )}
        </div>
        <Button
          className="h-11"
          onClick={() => {
            patchState({ dialog: { kind: "add-hosts" } });
          }}
          icon={<Plus size={15} />}
        >
          Add hosts
        </Button>
        <div className="flex h-11 items-center rounded-2xl border border-slate-300/80 bg-white/88 p-1 shadow-sm backdrop-blur-xl dark:border-white/[0.075] dark:bg-white/[0.035]">
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
