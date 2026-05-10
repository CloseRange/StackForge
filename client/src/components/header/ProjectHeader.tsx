import {
  Activity,
  KanbanSquare,
  Layers3,
  Settings,
  Sparkles,
  Users,
  Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Logo } from "./Logo";
import { NotificationBell } from "./NotificationBell";
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

const TABS: Array<{ id: ProjectTab; label: string; icon: LucideIcon }> = [
  { id: "board", label: "Board", icon: KanbanSquare },
  { id: "decks", label: "Decks", icon: Layers3 },
  { id: "members", label: "Members", icon: Users },
  { id: "timeline", label: "Timeline", icon: Sparkles },
  { id: "activity", label: "Activity", icon: Activity },
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
      <div className="mx-auto max-w-[1600px] px-3 py-2 sm:px-4 sm:py-2.5 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2 sm:gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <Logo href="/" />
            <span className={`hidden sm:block ${
              isDarkMode ? "text-slate-600" : "text-slate-300"
            }`}>/</span>
            <ProjectIcon
              icon={projectIcon}
              alt={`${projectName} icon`}
              className="h-4.5 w-4.5 sm:h-5 sm:w-5"
              tone="neutral"
              fallbackClassName={`h-4.5 w-4.5 sm:h-5 sm:w-5 ${
                isDarkMode ? "text-slate-300" : "text-slate-400"
              }`}
            />
            <span className={`max-w-[9.5rem] truncate text-sm font-semibold sm:max-w-52 ${
              isDarkMode ? "text-white" : "text-slate-900"
            }`}>
              {projectName}
            </span>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-3">
            <div className={`flex items-center gap-1 rounded-lg border px-2 py-1 md:hidden ${
              isDarkMode
                ? "border-amber-300/30 bg-amber-400/10"
                : "border-amber-200 bg-amber-50"
            }`}>
              <Zap className={`h-3 w-3 ${
                isDarkMode ? "text-amber-300" : "text-amber-600"
              }`} />
              <span className={`text-[11px] font-semibold ${
                isDarkMode ? "text-amber-200" : "text-amber-700"
              }`}>
                {xp.toLocaleString()}
              </span>
            </div>

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
                className={`btn-motion btn-shimmer hidden items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-sm font-medium transition lg:flex ${
                  isDarkMode
                    ? "border-white/12 bg-white/[0.04] text-slate-300 hover:bg-white/[0.09] hover:text-white"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Settings className="h-4 w-4" />
                Project Settings
              </button>
            ) : null}

            <NotificationBell />

            <ProfileMenu />
          </div>
        </div>

        <nav
          className={`relative mt-2 flex w-full items-center gap-1 overflow-x-auto rounded-2xl border p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
            isDarkMode
              ? "border-white/10 bg-black/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
              : "border-slate-200 bg-slate-100/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
          }`}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange?.(tab.id)}
                aria-label={tab.label}
                aria-current={isActive ? "page" : undefined}
                className={`btn-motion btn-shimmer group relative overflow-hidden rounded-xl border py-1.5 text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? isDarkMode
                      ? "border-cyan-300/45 bg-[linear-gradient(180deg,rgba(14,165,233,0.34),rgba(2,132,199,0.2))] px-3.5 text-cyan-100 shadow-[0_8px_22px_-10px_rgba(14,165,233,0.75)] sm:px-4"
                      : "border-sky-300 bg-[linear-gradient(180deg,rgba(219,234,254,1),rgba(191,219,254,0.94))] px-3.5 text-sky-800 shadow-[0_8px_18px_-12px_rgba(2,132,199,0.6)] sm:px-4"
                    : isDarkMode
                      ? "border-white/5 bg-white/[0.03] px-2.5 text-slate-300 hover:border-white/20 hover:bg-white/[0.08] hover:text-white sm:px-3"
                      : "border-slate-200 bg-white/70 px-2.5 text-slate-600 hover:border-slate-300 hover:bg-white hover:text-slate-900 sm:px-3"
                }`}
              >
                <span
                  className={`pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${
                    isDarkMode
                      ? "bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.13),transparent_55%)]"
                      : "bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.85),transparent_55%)]"
                  }`}
                />
                <span className="relative flex items-center">
                  <Icon className={`h-3.5 w-3.5 shrink-0 transition-transform duration-300 ${isActive ? "motion-safe:scale-110" : ""}`} />
                  <span
                    className={`overflow-hidden whitespace-nowrap text-xs transition-all duration-300 sm:text-sm ${
                      isActive ? "ml-1.5 max-w-24 opacity-100" : "ml-0 max-w-0 opacity-0"
                    }`}
                  >
                    {tab.label}
                  </span>
                </span>
                {isActive ? (
                  <span
                    className={`pointer-events-none absolute inset-x-2 bottom-0.5 h-[2px] rounded-full ${
                      isDarkMode ? "bg-cyan-200/95" : "bg-sky-500"
                    }`}
                  />
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
