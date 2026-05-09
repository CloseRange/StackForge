import { Settings, Zap } from "lucide-react";

import { Logo } from "./Logo";
import { ProjectIcon } from "../ui/ProjectIcon";
import { ProfileMenu } from "./ProfileMenu";

type ProjectTab = "board" | "decks" | "members" | "timeline" | "activity" | "settings";

type ProjectHeaderProps = {
  projectName: string;
  projectIcon?: string | null;
  xp?: number;
  xpMax?: number;
  activeTab?: ProjectTab;
  onTabChange?: (tab: ProjectTab) => void;
  onSettings?: () => void;
  showSettings?: boolean;
};

const TABS: { id: ProjectTab; label: string }[] = [
  { id: "board", label: "Board" },
  { id: "decks", label: "Decks" },
  { id: "members", label: "Members" },
  { id: "timeline", label: "Timeline" },
  { id: "activity", label: "Activity" },
];

export const ProjectHeader = ({
  projectName,
  projectIcon,
  xp = 0,
  xpMax = 2000,
  activeTab = "board",
  onTabChange,
  onSettings,
  showSettings = true,
}: ProjectHeaderProps) => (
  <header className="sticky top-0 z-40 border-b border-white/[0.12] bg-[linear-gradient(180deg,rgba(12,18,30,0.95),rgba(9,14,24,0.92))] backdrop-blur-md">
    <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-6">
      {/* Left — logo + project name */}
      <div className="flex items-center gap-3">
        <Logo href="/" />
        <span className="hidden text-slate-600 sm:block">/</span>
        <ProjectIcon
          icon={projectIcon}
          alt={`${projectName} icon`}
          className="hidden h-5 w-5 sm:block"
          tone="neutral"
          fallbackClassName="hidden h-5 w-5 text-slate-300 sm:block"
        />
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
                ? "border-sky-300/40 bg-sky-500/12 text-sky-100 shadow-[0_0_0_1px_rgba(125,211,252,0.16)]"
                : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Right — XP + settings + avatar */}
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-1.5 rounded-xl border border-amber-300/30 bg-amber-400/10 px-3 py-1.5 md:flex">
          <Zap className="h-3.5 w-3.5 text-amber-300" />
          <span className="text-xs font-semibold text-amber-200">
            {xp.toLocaleString()} / {xpMax.toLocaleString()} XP
          </span>
        </div>

        {showSettings ? (
          <button
            type="button"
            onClick={onSettings}
            className="hidden items-center gap-1.5 rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-1.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.09] hover:text-white sm:flex"
          >
            <Settings className="h-4 w-4" />
            Project Settings
          </button>
        ) : null}

        <ProfileMenu />
      </div>
    </div>
  </header>
);
