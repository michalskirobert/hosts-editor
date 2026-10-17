import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useHostsEditorContext } from "@renderer/context/useHostsEditorContext";
import { getNotificationLevel } from "@renderer/lib/notifications";
import { IconButton } from "./IconButton";

export const Toast = () => {
  const { state, patchState } = useHostsEditorContext();
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const exit = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const remaining = useRef(3000);
  const started = useRef(0);
  const hovered = useRef(false);
  const focused = useRef(false);
  const level = getNotificationLevel(state.message);
  const isError = level === "error";
  const isWarning = level === "warning";
  const isSuccess = level === "success";

  const clear = useCallback((): void => {
    clearTimeout(timer.current);
    timer.current = undefined;
  }, []);

  const dismiss = useCallback((): void => {
    clear();
    setVisible(false);
    clearTimeout(exit.current);
    exit.current = setTimeout(() => {
      patchState({ message: "" });
    }, 160);
  }, [clear, patchState]);

  const resume = useCallback((): void => {
    if (hovered.current || focused.current) return;
    clear();
    started.current = performance.now();
    timer.current = setTimeout(dismiss, Math.max(0, remaining.current));
  }, [clear, dismiss]);

  const pause = (): void => {
    if (timer.current !== undefined)
      remaining.current = Math.max(0, remaining.current - (performance.now() - started.current));
    clear();
  };

  useEffect(() => {
    clearTimeout(exit.current);
    clear();

    if (!state.message) {
      hovered.current = false;
      focused.current = false;
      setVisible(false);
      return;
    }

    remaining.current = isError ? 6000 : isWarning ? 4500 : 3000;
    setVisible(true);
    resume();

    return () => {
      clear();
      clearTimeout(exit.current);
    };
  }, [clear, isError, isWarning, resume, state.message]);

  if (!state.message) return null;

  const Icon = isError ? AlertCircle : isWarning ? AlertTriangle : isSuccess ? CheckCircle2 : Info;
  const tone = isError
    ? "text-red-500"
    : isWarning
      ? "text-orange-500"
      : isSuccess
        ? "text-emerald-500"
        : "text-sky-500";

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      aria-atomic="true"
      onMouseEnter={() => {
        hovered.current = true;
        pause();
      }}
      onMouseLeave={() => {
        hovered.current = false;
        resume();
      }}
      onFocusCapture={() => {
        focused.current = true;
        pause();
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          focused.current = false;
          resume();
        }
      }}
      className={`fixed bottom-5 right-5 z-[1200] flex max-w-md items-start gap-3 rounded-2xl border border-slate-300/80 bg-white/95 px-4 py-3 text-sm text-slate-900 shadow-xl backdrop-blur-2xl transition-opacity duration-150 motion-reduce:transition-none dark:border-white/10 dark:bg-[#0b111b]/95 dark:text-slate-100 ${visible ? "opacity-100" : "opacity-0"}`}
    >
      <Icon size={18} className={`mt-0.5 shrink-0 ${tone}`} />
      <span className="flex-1">{state.message}</span>
      <IconButton label="Dismiss notification" className="-mr-2 -mt-2" onClick={dismiss}>
        <X size={15} />
      </IconButton>
    </div>
  );
};
