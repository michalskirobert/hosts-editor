import { FileCode2, Import, Plus, Search, Table2, X } from "lucide-react";

import { parseHostsText } from "../../../../shared/domain/hosts";
import { ModeButton } from "../../components/ui/ModeButton";
import { useHostsEditorContext } from "@renderer/context/useHostsEditorContext";
import { RawEditor } from "./RawEditor";
import { StructuredEditor } from "./StructuredEditor";

export const EditorPage = () => {
  const { state, tab, patchState, createTab, importIntoCurrent, switchMode, setLines } =
    useHostsEditorContext();

  if (!tab) {
    return (
      <div className="mx-auto mt-24 max-w-lg rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-white/15 dark:bg-[#0f1622]">
        <FileCode2 size={38} className="mx-auto mb-5 text-slate-400" />

        <h2 className="text-xl font-semibold">No host tabs yet</h2>

        <p className="mt-2 text-sm text-slate-400">
          Keep projects isolated in tabs, then save them to your system hosts file.
        </p>

        <div className="mt-6 flex justify-center gap-2">
          <button
            className="action"
            onClick={() => {
              void importIntoCurrent();
            }}
          >
            <Import size={15} />
            Import system hosts
          </button>

          <button
            className="primary"
            onClick={() => {
              void createTab();
            }}
          >
            <Plus size={15} />
            Create empty tab
          </button>
        </div>
      </div>
    );
  }

  const addHost = (): void => {
    const id = crypto.randomUUID();

    patchState({
      query: "",
      mode: "structured",
    });

    setLines([
      ...tab.lines,
      {
        id,
        kind: "host",
        enabled: true,
        address: "127.0.0.1",
        hostname: "",
        comment: "",
        raw: "",
      },
    ]);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const row = document.querySelector<HTMLElement>(`[data-host-id="${id}"]`);

        row?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        row?.querySelector<HTMLInputElement>("[data-hostname-input]")?.focus();
      });
    });
  };

  return (
    <div className="mx-auto max-w-6xl mt-5 pb-5">
      <div className="sticky top-0 mb-4 flex gap-3 border-slate-200 bg-white/70 dark:border-white/8 dark:bg-[#090d14]/80">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

          <input
            value={state.query}
            onChange={(event) => {
              patchState({ query: event.target.value });
            }}
            placeholder="Search hosts…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm outline-none dark:border-white/10 dark:bg-white/5"
          />

          {state.query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                patchState({ query: "" });
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-slate-200"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <button type="button" className="action" onClick={addHost}>
          <Plus size={15} />
          Add host
        </button>

        <div className="flex rounded-xl border border-slate-200 bg-white p-1 dark:border-white/10 dark:bg-white/5">
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
  );
};
