import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useHostsEditorContext } from "@renderer/context/useHostsEditorContext";
import { IconButton } from "./IconButton";

const DEFAULT_DURATION = 3000;

export const Toast = () => {
  const { state, patchState } = useHostsEditorContext();
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAtRef = useRef(0);
  const remainingRef = useRef(DEFAULT_DURATION);

  const clearTimer = useCallback((): void => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const dismiss = useCallback((): void => {
    clearTimer();
    setVisible(false);
    window.setTimeout(() => {
      patchState({ message: "" });
    }, 160);
  }, [clearTimer, patchState]);

  const startTimer = useCallback((): void => {
    clearTimer();
    startedAtRef.current = Date.now();
    timerRef.current = setTimeout(dismiss, remainingRef.current);
  }, [clearTimer, dismiss]);

  const pauseTimer = useCallback((): void => {
    if (!timerRef.current) return;
    remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startedAtRef.current));
    clearTimer();
  }, [clearTimer]);

  const resumeTimer = useCallback((): void => {
    if (!state.message || remainingRef.current <= 0) return;
    startTimer();
  }, [startTimer, state.message]);

  useEffect(() => {
    if (!state.message) {
      clearTimer();
      setVisible(false);
      return;
    }
    remainingRef.current = DEFAULT_DURATION;
    setVisible(true);
    startTimer();
    return clearTimer;
  }, [clearTimer, startTimer, state.message]);

  if (!state.message) return null;
  const isError = /failed|error|could not|invalid/i.test(state.message);
  const isSuccess = /up to date|saved|created|imported|exported/i.test(state.message);
  const Icon = isError ? AlertCircle : isSuccess ? CheckCircle2 : Info;
  const tone = isError ? "text-red-500" : isSuccess ? "text-emerald-500" : "text-sky-500";

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      onMouseEnter={pauseTimer}
      onMouseLeave={resumeTimer}
      onFocusCapture={pauseTimer}
      onBlurCapture={resumeTimer}
      className={`fixed bottom-5 right-5 z-[1200] flex max-w-md items-start gap-3 rounded-2xl border border-slate-300/80 bg-white/94 px-4 py-3 text-sm text-slate-900 shadow-[0_22px_70px_-28px_rgba(15,23,42,0.55)] backdrop-blur-2xl transition-[opacity,transform] duration-150 motion-reduce:transition-none dark:border-white/10 dark:bg-[#0b111b]/90 dark:text-slate-100 ${visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
    >
      <Icon size={18} className={`mt-0.5 shrink-0 ${tone}`} />
      <span className="flex-1">{state.message}</span>
      <IconButton label="Dismiss notification" className="-mr-2 -mt-2" onClick={dismiss}>
        <X size={15} />
      </IconButton>
    </div>
  );
};
