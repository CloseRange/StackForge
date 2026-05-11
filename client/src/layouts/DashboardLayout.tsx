import type { ReactNode } from "react";

import { ProjectIcon } from "../components/ui/ProjectIcon";

type DashboardLayoutProps = {
  sidebar?: ReactNode;
  children: ReactNode;
  backgroundIcon?: string | null;
};

export const DashboardLayout = ({ sidebar, children, backgroundIcon }: DashboardLayoutProps) => {
  const isDarkMode = !document.documentElement.hasAttribute("data-theme") || 
                     document.documentElement.getAttribute("data-theme") === "dark";

  const panelClasses = isDarkMode
    ? "rounded-[2rem] border border-white/[0.22] bg-[linear-gradient(180deg,rgba(70,100,130,0.25),rgba(50,70,100,0.22))] p-2.5 sm:p-4 md:p-5 shadow-glow"
    : "rounded-[2rem] border border-slate-200 bg-white p-2.5 sm:p-4 md:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]";

  return (
    <div className="min-h-screen px-2 py-2 sm:px-3 sm:py-3 md:px-6 md:py-6">
      <div
        className={`mx-auto grid min-h-[calc(100vh-5rem)] max-w-[1600px] gap-3 sm:gap-4 ${
          sidebar ? "lg:grid-cols-[320px_1fr]" : "lg:grid-cols-1"
        }`}
      >
        {sidebar ? (
          <aside className={`order-2 lg:order-1 ${panelClasses}`}>
            {sidebar}
          </aside>
        ) : null}
        <div className={`relative order-1 overflow-hidden lg:order-2 ${panelClasses}`}>
          {backgroundIcon ? (
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute -bottom-6 -right-6 ${
                isDarkMode ? "opacity-[0.055]" : "opacity-[0.035]"
              }`}
            >
              <ProjectIcon
                icon={backgroundIcon}
                className="h-64 w-64"
                tone="neutral"
                fallbackClassName={`h-64 w-64 ${isDarkMode ? "text-slate-200" : "text-slate-300"}`}
              />
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
};
