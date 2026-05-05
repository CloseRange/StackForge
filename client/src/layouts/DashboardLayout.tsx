import type { ReactNode } from "react";

import { Button } from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";

type DashboardLayoutProps = {
  title: string;
  subtitle: string;
  sidebar: ReactNode;
  children: ReactNode;
};

export const DashboardLayout = ({ title, subtitle, sidebar, children }: DashboardLayoutProps) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1600px] gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-5 shadow-glow">{sidebar}</aside>
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/50 p-5 shadow-glow">
          <div className="mb-6 flex flex-col gap-4 border-b border-white/8 pb-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-sky-300">Command Board</p>
              <h1 className="mt-2 font-display text-3xl font-semibold text-white">{title}</h1>
              <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-right">
                <div className="text-xs uppercase tracking-[0.28em] text-slate-500">Operator</div>
                <div className="text-sm font-semibold text-white">{user?.displayName}</div>
              </div>
              <Button variant="ghost" onClick={logout}>
                Sign Out
              </Button>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};
