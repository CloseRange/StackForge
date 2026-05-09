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
}: ProjectHeaderProps) => {
  const isDarkMode = !document.documentElement.hasAttribute("data-theme") || 
                     document.documentElement.getAttribute("data-theme") === "dark";

  return (
    <header className={`sticky top-0 z-40 border-b backdrop-blur-md ${
      isDarkMode
        ? "border-white/[0.12] bg-[linear-gradient(180deg,rgba(12,18,30,0.95),rgba(9,14,24,0.92))]"
        : "border-slate-200 bg-white"
    }`}>
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-6">
        {/* Left — logo + project name */}
        <div className="flex items-center gap-3">
          <Logo href="/" />
          <span className={`hidden sm:block ${
            isDarkMode ? "text-slate-600" : "text-slate-300"
          }`}>/</span>
          <ProjectIcon
            icon={projectIcon}
            alt={`${projectName} icon`}
            className="hidden h-5 w-5 sm:block"
            tone="neutral"
            fallbackClassName={`hidden h-5 w-5 sm:block ${
              isDarkMode ? "text-slate-300" : "text-slate-400"
            }`}
          />
          <span className={`hidden max-w-48 truncate text-sm font-semibold sm:block ${
            isDarkMode ? "text-white" : "text-slate-900"
          }`}>
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
                  ? isDarkMode
                    ? "border-sky-300/40 bg-sky-500/12 text-sky-100 shadow-[0_0_0_1px_rgba(125,211,252,0.16)]"
                    : "border-blue-300 bg-blue-50 text-blue-700 shadow-[0_0_0_1px_rgba(37,99,235,0.16)]"
                  : isDarkMode
                    ? "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Right — XP + settings + avatar */}
        <div className="flex items-center gap-3">
          <div className={`hidden items-center gap-1.5 rounded-xl border px-3 py-1.5 md:flex ${
            isDarkMode
              ? "border-amber-300/30 bg-amber-400/10"
              : "border-amber-200 bg-amber-50"
          }`}>
            <Zap className={`h-3.5 w-3.5 ${
              isDarkMode ? "text-amber-300" : "text-amber-600"
            }`} />
            <span className={`text-xs font-semibold ${
              isDarkMode ? "text-amber-200" : "text-amber-700"
            }`}>
              {xp.toLocaleString()} / {xpMax.toLocaleString()} XP
            </span>
          </div>

          {showSettings ? (
            <button
              type="button"
              onClick={onSettings}
              className={`hidden items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-sm font-medium transition sm:flex ${
                isDarkMode
                  ? "border-white/12 bg-white/[0.04] text-slate-300 hover:bg-white/[0.09] hover:text-white"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
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
};
