import { UserPlus, Zap } from "lucide-react";

import { Logo } from "./Logo";
import { ProfileMenu } from "./ProfileMenu";

type ProjectTab = "board" | "decks" | "activity";

type ProjectHeaderProps = {
  projectName: string;
  xp?: number;
  xpMax?: number;
  activeTab?: ProjectTab;
  onTabChange?: (tab: ProjectTab) => void;
  onInvite?: () => void;
};

const TABS: { id: ProjectTab; label: string }[] = [
  { id: "board", label: "Board" },
  { id: "decks", label: "Decks" },
  { id: "activity", label: "Activity" },
];

export const ProjectHeader = ({
  projectName,
  xp = 0,
  xpMax = 2000,
  activeTab = "board",
  onTabChange,
  onInvite,
}: ProjectHeaderProps) => (
  <header className="sticky top-0 z-40 border-b border-white/[0.12] bg-slate-900/85 backdrop-blur-md">
    <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-6">
      {/* Left — logo + project name */}
      <div className="flex items-center gap-3">
        <Logo href="/" />
        <span className="hidden text-slate-600 sm:block">/</span>
        <span className="hidden max-w-48 truncate text-sm font-semibold text-white sm:block">
          {projectName}
        </span>
      </div>

      {/* Center — tabs */}
      <nav className="flex items-center gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange?.(tab.id)}
            className={`rounded-xl border px-4 py-1.5 text-sm font-semibold transition ${
              activeTab === tab.id
                ? "border-sky-300/35 bg-sky-500/15 text-sky-100"
                : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Right — XP + invite + avatar */}
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-1.5 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 md:flex">
          <Zap className="h-3.5 w-3.5 text-amber-300" />
          <span className="text-xs font-semibold text-amber-200">
            {xp.toLocaleString()} / {xpMax.toLocaleString()} XP
          </span>
        </div>

        <button
          type="button"
          onClick={onInvite}
          className="hidden items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white sm:flex"
        >
          <UserPlus className="h-4 w-4" />
          Invite
        </button>

        <ProfileMenu />
      </div>
    </div>
  </header>
);
