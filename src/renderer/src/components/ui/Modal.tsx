import { X } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@renderer/lib/cn";
import { IconButton } from "./IconButton";

interface ModalProps {
  readonly title: string;
  readonly children: ReactNode;
  readonly onClose: () => void;
  readonly wide?: boolean;
}

export const Modal = ({ title, children, onClose, wide = false }: ModalProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-6 backdrop-blur-md dark:bg-black/55">
    <div
      className={cn(
        "w-full rounded-[28px] border border-white/75 bg-white/78 p-6 shadow-[0_32px_100px_-30px_rgba(15,23,42,0.55)] backdrop-blur-3xl backdrop-saturate-150 dark:border-white/12 dark:bg-[#0b111b]/82 dark:shadow-[0_36px_110px_-30px_rgba(0,0,0,0.9)]",
        wide ? "max-w-5xl" : "max-w-xl",
      )}
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-[-0.02em]">{title}</h2>
        <IconButton label="Close" onClick={onClose}>
          <X size={18} />
        </IconButton>
      </div>
      {children}
    </div>
  </div>
);
