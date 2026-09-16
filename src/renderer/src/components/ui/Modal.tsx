import { X } from "lucide-react";
import type { ReactNode } from "react";

interface ModalProps {
  readonly title: string;
  readonly children: ReactNode;
  readonly onClose: () => void;
}

export const Modal = ({ title, children, onClose }: ModalProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-6 backdrop-blur-sm">
    <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#111925]">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button onClick={onClose} className="icon">
          <X size={17} />
        </button>
      </div>
      {children}
    </div>
  </div>
);
