import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@renderer/lib/cn";

interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
  readonly children: ReactNode;
}

export const ScrollArea = ({ children, className, ...props }: ScrollAreaProps) => (
  <div
    className={cn(
      "overflow-auto [scrollbar-color:rgb(148_163_184_/_0.45)_transparent] [scrollbar-width:thin] dark:[scrollbar-color:rgb(255_255_255_/_0.16)_transparent] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-400/35 hover:[&::-webkit-scrollbar-thumb]:bg-slate-400/55 dark:[&::-webkit-scrollbar-thumb]:bg-white/15 dark:hover:[&::-webkit-scrollbar-thumb]:bg-white/25",
      className,
    )}
    {...props}
  >
    {children}
  </div>
);
