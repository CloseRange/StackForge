import type { ReactNode } from "react";

import { ProjectIcon } from "../components/ui/ProjectIcon";

type DashboardLayoutProps = {
  sidebar?: ReactNode;
  children: ReactNode;
  backgroundIcon?: string | null;
};

export const DashboardLayout = ({ sidebar, children, backgroundIcon }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen px-4 py-4 md:px-6 md:py-6">
      <div
        className={`mx-auto grid min-h-[calc(100vh-5rem)] max-w-[1600px] gap-4 ${
          sidebar ? "lg:grid-cols-[320px_1fr]" : "lg:grid-cols-1"
        }`}
      >
        {sidebar ? (
          <aside className="rounded-[2rem] border border-white/[0.22] bg-[linear-gradient(180deg,rgba(70,100,130,0.25),rgba(50,70,100,0.22))] p-5 shadow-glow">
            {sidebar}
          </aside>
        ) : null}
        <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.22] bg-[linear-gradient(180deg,rgba(60,90,120,0.25),rgba(40,60,90,0.22))] p-5 shadow-glow">
          {backgroundIcon ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-6 -right-6 opacity-[0.055]"
            >
              <ProjectIcon
                icon={backgroundIcon}
                className="h-64 w-64"
                tone="neutral"
                fallbackClassName="h-64 w-64 text-slate-200"
              />
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
};
