import { X } from "lucide-react";
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

export const Modal = ({ title, children, onClose, wide = false, footer }: ModalProps) =>
  createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-md dark:bg-black/65">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "flex max-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden rounded-[28px] border border-white/75 bg-white/90 shadow-[0_32px_100px_-30px_rgba(15,23,42,0.55)] backdrop-blur-3xl backdrop-saturate-150 dark:border-white/12 text-slate-900 dark:bg-[#0b111b]/95 dark:text-slate-100 dark:shadow-[0_36px_110px_-30px_rgba(0,0,0,0.9)]",
          wide ? "max-w-4xl" : "max-w-xl",
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200/60 px-6 py-4 dark:border-white/[0.06]">
          <h2 className="text-lg font-semibold tracking-[-0.02em]">{title}</h2>
          <IconButton label="Close" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5 [scrollbar-color:rgba(100,116,139,0.45)_transparent] [scrollbar-gutter:stable] [scrollbar-width:thin]">
          {children}
        </div>
        {footer && (
          <div className="shrink-0 border-t border-slate-200/60 bg-white/72 px-6 py-4 backdrop-blur-2xl dark:border-white/[0.06] dark:bg-[#0b111b]/88">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
