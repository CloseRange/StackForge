import { Plus, Search } from "lucide-react";
import { Link } from "react-router-dom";

import { Logo } from "./Logo";
import { ProfileMenu } from "./ProfileMenu";

type DashboardHeaderProps = {
  onNewProject?: () => void;
};

export const DashboardHeader = ({ onNewProject }: DashboardHeaderProps) => (
  <header className="sticky top-0 z-40 border-b border-white/[0.12] bg-[linear-gradient(180deg,rgba(12,18,30,0.95),rgba(9,14,24,0.92))] backdrop-blur-md">
    <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-6">
      {/* Left — logo */}
      <Logo href="/dashboard" />

      {/* Center — nav */}
      <nav className="hidden items-center gap-1 md:flex">
        <Link
          to="/"
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/5"
        >
          Projects
        </Link>
      </nav>

      {/* Right — actions */}
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-3 py-1.5 md:flex">
          <Search className="h-3.5 w-3.5 text-slate-500" />
          <input
            type="search"
            placeholder="Search projects..."
            className="w-40 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          />
        </div>

        <button
          type="button"
          onClick={onNewProject}
          className="flex items-center gap-1.5 rounded-xl border border-sky-200/35 bg-gradient-to-r from-sky-300 via-cyan-300 to-indigo-300 px-3.5 py-2 text-sm font-semibold text-slate-950 shadow-md shadow-sky-500/20 transition hover:from-sky-200 hover:via-cyan-200 hover:to-indigo-200"
        >
          <Plus className="h-4 w-4" />
          New Project
        </button>

        <ProfileMenu />
      </div>
    </div>
  </header>
);
