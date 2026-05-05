import type { ReactNode } from "react";

type DashboardLayoutProps = {
  sidebar: ReactNode;
  children: ReactNode;
};

export const DashboardLayout = ({ sidebar, children }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-[1600px] gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-5 shadow-glow">{sidebar}</aside>
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/50 p-5 shadow-glow">
          {children}
        </div>
      </div>
    </div>
  );
};
