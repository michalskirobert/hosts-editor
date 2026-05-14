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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 backdrop-blur-sm p-4 animate-[fadeIn_140ms_ease-out]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`
  relative flex flex-col overflow-hidden
  border border-slate-200/80
  bg-white
  shadow-[0_20px_50px_rgba(15,23,42,0.12)]
  transition-all duration-300
  animate-[modalIn_180ms_ease-out]
  ${sizeClassMap[size]}
  ${size === "fullscreen" ? "" : "rounded-3xl"}
`}
      >
        <header className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
          <h2
            id="modal-title"
            className="text-base font-semibold tracking-tight text-slate-800"
          >
            {title}
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Zamknij modal"
              className="rounded-xl border border-transparent p-2 text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-slate-800 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            >
              <Xmark className="h-5 w-5 " />
            </button>
          )}
        </header>

        <section className="flex-1 overflow-y-auto px-6 py-5 text-sm text-slate-700">
          {children}
        </section>
        {footer && (
          <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 bg-slate-50/70 px-6 py-4">
            <div className="flex w-full flex-col-reverse gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
              {footer}
            </div>
          </footer>
        )}
      </div>
    </div>
  );
};
