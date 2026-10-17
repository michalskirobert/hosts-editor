import { X } from "lucide-react";
import { useId, useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

import { cn } from "@renderer/lib/cn";
import { IconButton } from "./IconButton";

interface ModalProps {
  readonly title: string;
  readonly children: ReactNode;
  readonly onClose: () => void;
  readonly wide?: boolean;
  readonly footer?: ReactNode;
}

export const Modal = ({ title, children, onClose, wide = false, footer }: ModalProps) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    const previous = document.activeElement;
    if (!dialog) return;

    dialog.showModal();
    titleRef.current?.focus({ preventScroll: true });
    if (bodyRef.current) bodyRef.current.scrollTop = 0;

    const frame = requestAnimationFrame(() => {
      if (bodyRef.current) bodyRef.current.scrollTop = 0;
    });

    return () => {
      cancelAnimationFrame(frame);
      dialog.close();
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus({ preventScroll: true });
    };
  }, []);

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className={cn(
        "fixed inset-0 m-auto max-h-[calc(100dvh_-_2rem)] w-[calc(100vw_-_2rem)] overflow-hidden rounded-[28px] border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/45 backdrop:backdrop-blur-md [&[open]]:flex [&[open]]:flex-col dark:border-white/10 dark:bg-[#0b111b] dark:text-slate-100 dark:backdrop:bg-black/65",
        wide ? "max-w-4xl" : "max-w-xl",
      )}
    >
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200/70 px-6 py-4 dark:border-white/[0.07]">
        <h2
          ref={titleRef}
          id={titleId}
          tabIndex={-1}
          className="min-w-0 text-lg font-semibold tracking-tight outline-none"
        >
          {title}
        </h2>
        <IconButton label="Close" onClick={onClose}>
          <X size={18} />
        </IconButton>
      </header>
      <div
        ref={bodyRef}
        className="min-h-0 flex-auto overflow-y-auto overscroll-contain px-6 py-5 [scrollbar-color:rgba(100,116,139,0.45)_transparent] [scrollbar-gutter:stable] [scrollbar-width:thin]"
      >
        {children}
      </div>
      {footer && (
        <footer className="shrink-0 border-t border-slate-200/70 px-6 py-4 dark:border-white/[0.07]">
          {footer}
        </footer>
      )}
    </dialog>,
    document.body,
  );
};
