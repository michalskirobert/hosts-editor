"use client";

import { Xmark } from "iconoir-react";
import type { PropsWithChildren, ReactNode } from "react";

type ModalSize = "xs" | "sm" | "md" | "lg" | "fullscreen";

interface ModalProps extends PropsWithChildren {
  title: string;
  footer?: ReactNode;
  size?: ModalSize;
  isOpen?: boolean;
  onClose?: () => void;
}

const sizeClassMap: Record<ModalSize, string> = {
  xs: "w-full max-w-sm",
  sm: "w-full max-w-md",
  md: "w-full max-w-lg",
  lg: "w-full max-w-3xl",
  fullscreen: "w-screen h-screen max-w-none rounded-none",
};

export const Modal = ({
  title,
  children,
  footer,
  size = "md",
  isOpen,
  onClose,
}: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 p-4 animate-[fadeIn_140ms_ease-out]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`
  relative flex flex-col overflow-hidden
  border border-zinc-200 dark:border-zinc-800
  bg-white dark:bg-zinc-950
  text-zinc-900 dark:text-zinc-100
  shadow-[0_20px_50px_rgba(0,0,0,0.25)]
  transition-all duration-300
  animate-[modalIn_180ms_ease-out]
  ${sizeClassMap[size]}
  ${size === "fullscreen" ? "" : "rounded-3xl"}
`}
      >
        <header className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 px-6 py-4">
          <h2
            id="modal-title"
            className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
          >
            {title}
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Zamknij modal"
              className="rounded-xl border border-transparent p-2 text-zinc-500 transition-all duration-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/30"
            >
              <Xmark className="h-5 w-5 " />
            </button>
          )}
        </header>

        <section className="flex-1 overflow-y-auto px-6 py-5 text-sm text-zinc-700 dark:text-zinc-300">
          {children}
        </section>
        {footer && (
          <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 px-6 py-4">
            <div className="flex w-full flex-col-reverse gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
              {footer}
            </div>
          </footer>
        )}
      </div>
    </div>
  );
};
