import { CircleCheck, CircleDot, Pencil, Plus, Save, Trash2 } from "lucide-react";

import { Input } from "@renderer/components/shared/form";
import { IconButton } from "@renderer/components/ui/IconButton";
import { Tooltip } from "@renderer/components/ui/Tooltip";
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
      <div className="mb-2 mt-6 flex items-center justify-between px-3 text-[10px] font-bold uppercase tracking-[.16em] text-slate-500 dark:text-slate-500">
        <span>Tabs</span>
        <IconButton
          label="Create tab"
          className="p-1.5"
          onClick={() => {
            void createTab();
          }}
        >
          <Plus size={16} />
        </IconButton>
      </div>
      <div className="space-y-1">
        {state.tabs.map((tab) => {
          const isRenaming = state.renamingId === tab.id;
          const active = state.selected === tab.id;
          const dirty = dirtyIds.has(tab.id);

          return (
            <div
              key={tab.id}
              className={`group flex items-center rounded-2xl border pr-1 transition-[transform,background-color,border-color,color,box-shadow] duration-300 ease-out motion-reduce:transition-none ${
                active
                  ? "translate-x-0.5 border-amber-300/55 bg-amber-50/80 text-slate-950 shadow-[0_10px_28px_-22px_rgba(245,158,11,0.62)] ring-1 ring-amber-200/35 dark:border-amber-300/15 dark:bg-amber-300/[0.07] dark:text-white dark:ring-amber-300/[0.06]"
                  : "border-transparent text-slate-600 motion-safe:hover:translate-x-0.5 hover:border-amber-300/55 hover:bg-amber-50/80 hover:text-slate-950 hover:shadow-[0_10px_28px_-22px_rgba(245,158,11,0.62)] hover:ring-1 hover:ring-amber-200/35 dark:text-slate-400 dark:hover:border-amber-300/15 dark:hover:bg-amber-300/[0.07] dark:hover:text-white dark:hover:ring-amber-300/[0.06]"
              }`}
            >
              <button
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 px-3 py-2.5 text-left text-sm focus-visible:rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/35"
                aria-current={active ? "page" : undefined}
                onClick={() => {
                  selectTab(tab.id);
                }}
              >
                <Tooltip label={dirty ? "Unsaved changes" : "Saved"}>
                  {dirty ? (
                    <CircleDot
                      size={15}
                      strokeWidth={2.5}
                      className="shrink-0 text-amber-500 drop-shadow-[0_0_5px_rgba(245,158,11,0.28)] dark:text-amber-300"
                    />
                  ) : (
                    <CircleCheck
                      size={15}
                      strokeWidth={2.25}
                      className="shrink-0 text-emerald-600 dark:text-emerald-400"
                    />
                  )}
                </Tooltip>
                {isRenaming ? (
                  <Input
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
                    className="min-w-0 flex-1 rounded-lg px-1.5 py-0.5"
                  />
                ) : (
                  <span
                    className="min-w-0 flex-1 truncate"
                    onDoubleClick={(event) => {
                      event.stopPropagation();
                      startRename(tab);
                    }}
                  >
                    {tab.name}
                  </span>
                )}
              </button>
              {isRenaming ? (
                <IconButton
                  label="Save tab name"
                  className="p-1.5 opacity-70 hover:opacity-100"
                  onMouseDown={(event) => {
                    event.preventDefault();
                  }}
                  onClick={commitRename}
                >
                  <Save size={13} />
                </IconButton>
              ) : (
                <IconButton
                  label="Rename tab"
                  onClick={() => {
                    startRename(tab);
                  }}
                  className="p-1.5 opacity-0 group-hover:opacity-65 focus-visible:opacity-100"
                >
                  <Pencil size={13} />
                </IconButton>
              )}
              <IconButton
                label="Delete tab"
                danger
                onClick={() => {
                  patchState({
                    dialog: { kind: "delete-tab", tab, deleteBackups: false },
                  });
                }}
                className="p-1.5 opacity-0 group-hover:opacity-65 focus-visible:opacity-100"
              >
                <Trash2 size={13} />
              </IconButton>
            </div>
          );
        })}
      </div>
    </>
  );
};
