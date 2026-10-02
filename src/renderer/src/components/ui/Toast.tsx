import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

import { useHostsEditorContext } from "@renderer/context/useHostsEditorContext";
import { IconButton } from "./IconButton";

export const Toast = () => {
  const { state, patchState } = useHostsEditorContext();
  if (!state.message) return null;
  const isError = /failed|error|could not/i.test(state.message);
  const isSuccess = /up to date|saved|created/i.test(state.message);
  const Icon = isError ? AlertCircle : isSuccess ? CheckCircle2 : Info;
  const tone = isError ? "text-red-500" : isSuccess ? "text-emerald-500" : "text-sky-500";

  return (
    <div className="fixed bottom-5 right-5 z-50 flex max-w-md items-start gap-3 rounded-2xl border border-white/75 bg-white/76 px-4 py-3 text-sm shadow-[0_22px_70px_-28px_rgba(15,23,42,0.55)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#0b111b]/78 dark:shadow-[0_24px_80px_-30px_rgba(0,0,0,0.9)]">
      <Icon size={18} className={`mt-0.5 shrink-0 ${tone}`} />
      <span className="flex-1">{state.message}</span>
      <IconButton
        label="Dismiss notification"
        className="-mr-2 -mt-2"
        onClick={() => {
          patchState({ message: "" });
        }}
      >
        <X size={15} />
      </IconButton>
    </div>
  );
};
