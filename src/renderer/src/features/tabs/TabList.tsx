import { Pencil, Plus, Save, Trash2 } from "lucide-react";

import { useHostsEditorContext } from "@renderer/context/useHostsEditorContext";

export const TabList = () => {
  const {
    state,
    dirtyIds,
    patchState,
    createTab,
    selectTab,
    startRename,
    commitRename,
    cancelRename,
  } = useHostsEditorContext();

  return (
    <>
      <div className="mb-2 mt-7 flex items-center justify-between px-3 text-[11px] font-bold uppercase tracking-[.14em] text-slate-400">
        <span>Tabs</span>
        <button
          title="Create tab"
          onClick={() => {
            void createTab();
          }}
        >
          <Plus size={15} />
        </button>
      </div>
      <div className="scroll max-h-[calc(100vh-330px)] space-y-1 overflow-auto">
        {state.tabs.map((tab) => {
          const isRenaming = state.renamingId === tab.id;
          const active = state.selected === tab.id;

          return (
            <div
              key={tab.id}
              className={`group flex items-center rounded-xl pr-1 ${
                active
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "hover:bg-slate-100 dark:hover:bg-white/5"
              }`}
            >
              <button
                className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left text-sm"
                onClick={() => {
                  selectTab(tab.id);
                }}
              >
                <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                {isRenaming ? (
                  <input
                    autoFocus
                    value={state.renameValue}
                    onChange={(event) => {
                      patchState({ renameValue: event.target.value });
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                    onBlur={commitRename}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") commitRename();
                      if (event.key === "Escape") cancelRename();
                    }}
                    className="min-w-0 flex-1 rounded bg-white/15 px-1 outline-none"
                  />
                ) : (
                  <span
                    className="min-w-0 flex-1 truncate"
                    onDoubleClick={(event) => {
                      event.stopPropagation();
                      startRename(tab);
                    }}
                  >
                    {dirtyIds.has(tab.id) && <span className="mr-1 text-amber-400">●</span>}
                    {tab.name}
                  </span>
                )}
              </button>
              {isRenaming ? (
                <button
                  title="Save tab name"
                  onMouseDown={(event) => {
                    event.preventDefault();
                  }}
                  onClick={commitRename}
                  className="rounded p-1.5 opacity-70 hover:opacity-100"
                >
                  <Save size={13} />
                </button>
              ) : (
                <button
                  title="Rename tab"
                  onClick={() => {
                    startRename(tab);
                  }}
                  className="rounded p-1.5 opacity-0 group-hover:opacity-60"
                >
                  <Pencil size={13} />
                </button>
              )}
              <button
                title="Delete tab"
                onClick={() => {
                  patchState({
                    dialog: { kind: "delete-tab", tab, deleteBackups: false },
                  });
                }}
                className="rounded p-1.5 opacity-0 hover:text-red-400 group-hover:opacity-60"
              >
                <Trash2 size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
};
