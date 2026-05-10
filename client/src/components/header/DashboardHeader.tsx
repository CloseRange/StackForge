import { Plus, Search } from "lucide-react";
import { Link } from "react-router-dom";

import { Logo } from "./Logo";
import { NotificationBell } from "./NotificationBell";
import { ProfileMenu } from "./ProfileMenu";

type DashboardHeaderProps = {
  onNewProject?: () => void;
};

export const DashboardHeader = ({ onNewProject }: DashboardHeaderProps) => {
  const isDarkMode = !document.documentElement.hasAttribute("data-theme") || 
                     document.documentElement.getAttribute("data-theme") === "dark";

  return (
    <header className={`sticky top-0 z-40 border-b backdrop-blur-md ${
      isDarkMode
        ? "border-white/[0.12] bg-[linear-gradient(180deg,rgba(12,18,30,0.95),rgba(9,14,24,0.92))]"
        : "border-slate-200 bg-white"
    }`}>
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-6">
        {/* Left — logo */}
        <Logo href="/dashboard" />

        {/* Center — nav */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link
            to="/"
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              isDarkMode
                ? "text-white hover:bg-white/5"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Projects
          </Link>
        </nav>

        {/* Right — actions */}
        <div className="flex items-center gap-3">
          <div className={`hidden items-center gap-2 rounded-xl border px-3 py-1.5 md:flex ${
            isDarkMode
              ? "border-white/12 bg-white/[0.04]"
              : "border-slate-200 bg-slate-50"
          }`}>
            <Search className={`h-3.5 w-3.5 ${
              isDarkMode ? "text-slate-500" : "text-slate-400"
            }`} />
            <input
              type="search"
              placeholder="Search projects..."
              className={`w-40 bg-transparent text-sm outline-none ${
                isDarkMode
                  ? "text-white placeholder:text-slate-500"
                  : "text-slate-900 placeholder:text-slate-400"
              }`}
            />
          </div>

          <button
            type="button"
            onClick={onNewProject}
            className={`btn-motion btn-shimmer flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-semibold transition ${
              isDarkMode
                ? "border-sky-200/35 bg-gradient-to-r from-sky-300 via-cyan-300 to-indigo-300 text-slate-950 shadow-md shadow-sky-500/20 hover:from-sky-200 hover:via-cyan-200 hover:to-indigo-200"
                : "border-blue-300 bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/20 hover:from-blue-600 hover:to-indigo-600"
            }`}
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>

          <NotificationBell />

          <ProfileMenu />
        </div>
      </div>
    </header>
  );
};
