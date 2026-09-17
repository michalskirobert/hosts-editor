import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

import { useHostsEditorContext } from "@renderer/context/useHostsEditorContext";

export const Toast = () => {
  const { state, patchState } = useHostsEditorContext();

  if (!state.message) return null;

  const isError = /failed|error|could not/i.test(state.message);
  const isSuccess = /up to date|saved|created/i.test(state.message);
  const Icon = isError ? AlertCircle : isSuccess ? CheckCircle2 : Info;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex max-w-md items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-xl dark:border-white/10 dark:bg-[#111925]">
      <Icon size={18} className="mt-0.5 shrink-0" />
      <span className="flex-1">{state.message}</span>
      <button
        type="button"
        className="icon -mr-2 -mt-2"
        onClick={() => {
          patchState({ message: "" });
        }}
        aria-label="Dismiss notification"
      >
        <X size={15} />
      </button>
    </div>
  );
};
