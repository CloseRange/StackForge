import type { ReactNode } from "react";

type DashboardLayoutProps = {
  sidebar?: ReactNode;
  children: ReactNode;
};

export const DashboardLayout = ({ sidebar, children }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen px-4 py-4 md:px-6 md:py-6">
      <div
        className={`mx-auto grid min-h-[calc(100vh-5rem)] max-w-[1600px] gap-4 ${
          sidebar ? "lg:grid-cols-[320px_1fr]" : "lg:grid-cols-1"
        }`}
      >
        {sidebar ? (
          <aside className="rounded-[2rem] border border-white/[0.14] bg-slate-800/50 p-5 shadow-glow">{sidebar}</aside>
        ) : null}
        <div className="rounded-[2rem] border border-white/[0.14] bg-slate-800/40 p-5 shadow-glow">
          {children}
        </div>
      </div>
    </div>
  );
};
