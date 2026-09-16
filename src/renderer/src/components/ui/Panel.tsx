import type { ReactNode } from "react";

export const Panel = ({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#0f1622]">
    <h2 className="mb-5 font-semibold">{title}</h2>
    {children}
  </section>
);
