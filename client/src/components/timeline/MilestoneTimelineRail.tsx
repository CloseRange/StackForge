import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Flag } from "lucide-react";

import type { MilestoneColor, MilestoneType, ProjectMilestone } from "../../types/api";

const DAY_MS = 86_400_000;

const milestoneColorClass: Record<MilestoneColor, string> = {
  sky: "border-sky-300/45 bg-sky-500/15 text-sky-100",
  amber: "border-amber-300/45 bg-amber-500/15 text-amber-100",
  emerald: "border-emerald-300/45 bg-emerald-500/15 text-emerald-100",
  rose: "border-rose-300/45 bg-rose-500/15 text-rose-100",
  violet: "border-violet-300/45 bg-violet-500/15 text-violet-100"
};

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
};

const formatTickDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric"
  });
};

const startOfDay = (timestamp: number) => {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

const getMilestoneTypeLabel = (type: MilestoneType) => {
  if (type === "xp") {
    return "XP";
  }

  return type.charAt(0).toUpperCase() + type.slice(1);
};

const getMilestoneDetail = (milestone: ProjectMilestone) => {
  if (milestone.type === "card" && milestone.targetCardTitle) {
    return `Card: ${milestone.targetCardTitle}`;
  }

  if (milestone.type === "deck" && milestone.targetDeckName) {
    return `Deck: ${milestone.targetDeckName}`;
  }

  if (milestone.type === "xp") {
    return `XP: ${milestone.progress.earnedXp.toLocaleString()} / ${(milestone.targetXp ?? 0).toLocaleString()}`;
  }

  if (milestone.type === "project") {
    return `Progress: ${milestone.progress.earnedXp.toLocaleString()} / ${milestone.progress.totalXp.toLocaleString()} XP`;
  }

  return null;
};

type MilestoneTimelineRailProps = {
  milestones: ProjectMilestone[];
  emptyMessage?: string;
};

type ActiveTooltip = {
  milestone: ProjectMilestone;
  anchor: HTMLButtonElement;
};

export const MilestoneTimelineRail = ({
  milestones,
  emptyMessage = "Add due dates to place milestones on the timeline."
}: MilestoneTimelineRailProps) => {
  const [activeTooltip, setActiveTooltip] = useState<ActiveTooltip | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);

  const updateTooltipPosition = useCallback((anchor: HTMLButtonElement) => {
    const rect = anchor.getBoundingClientRect();
    const panelWidth = 256;
    const margin = 16;
    const centeredLeft = rect.left + rect.width / 2 - panelWidth / 2;
    const maxLeft = window.innerWidth - panelWidth - margin;

    setTooltipPosition({
      top: rect.bottom + 12,
      left: Math.max(margin, Math.min(centeredLeft, maxLeft))
    });
  }, []);

  const openTooltip = useCallback(
    (milestone: ProjectMilestone, anchor: HTMLButtonElement) => {
      setActiveTooltip({ milestone, anchor });
      updateTooltipPosition(anchor);
    },
    [updateTooltipPosition]
  );

  const closeTooltip = useCallback(() => {
    setActiveTooltip(null);
    setTooltipPosition(null);
  }, []);

  useEffect(() => {
    if (!activeTooltip) {
      return;
    }

    const handleViewportChange = () => {
      updateTooltipPosition(activeTooltip.anchor);
    };

    window.addEventListener("scroll", handleViewportChange, true);
    window.addEventListener("resize", handleViewportChange);

    return () => {
      window.removeEventListener("scroll", handleViewportChange, true);
      window.removeEventListener("resize", handleViewportChange);
    };
  }, [activeTooltip, updateTooltipPosition]);

  const timeline = useMemo(() => {
    const datedMilestones = milestones
      .filter((milestone) => {
        if (!milestone.dueAt) {
          return false;
        }

        return !Number.isNaN(new Date(milestone.dueAt).getTime());
      })
      .sort((a, b) => new Date(a.dueAt as string).getTime() - new Date(b.dueAt as string).getTime());

    if (datedMilestones.length === 0) {
      return null;
    }

    const firstMilestone = datedMilestones[0]!;
    const lastMilestone = datedMilestones[datedMilestones.length - 1]!;
    const firstDueAt = new Date(firstMilestone.dueAt as string).getTime();
    const lastDueAt = new Date(lastMilestone.dueAt as string).getTime();
    const today = startOfDay(Date.now());
    const rawSpan = Math.max(lastDueAt - firstDueAt, DAY_MS * 14);
    const padding = Math.max(DAY_MS * 7, Math.round(rawSpan * 0.08));
    const start = Math.min(firstDueAt - padding, today - DAY_MS * 7);
    const end = Math.max(lastDueAt + padding + DAY_MS * 7, today + DAY_MS * 7);
    const span = Math.max(end - start, DAY_MS * 14);
    const width = Math.max(720, datedMilestones.length * 140, Math.ceil(span / DAY_MS) * 26);
    const tickCount = Math.min(10, Math.max(4, Math.round(width / 150)));
    const todayLeftPercent = ((today - start) / span) * 100;

    const ticks = Array.from({ length: tickCount }, (_, index) => {
      const ratio = tickCount === 1 ? 0 : index / (tickCount - 1);
      return {
        timestamp: start + span * ratio,
        leftPercent: ratio * 100
      };
    });

    return {
      width,
      ticks,
      todayLeftPercent,
      items: datedMilestones.map((milestone) => ({
        milestone,
        leftPercent:
          ((new Date(milestone.dueAt as string).getTime() - start) / span) * 100
      })),
      undatedCount: milestones.length - datedMilestones.length
    };
  }, [milestones]);

  if (!timeline) {
    return (
      <div className="rounded-xl border border-dashed border-white/15 bg-slate-950/40 px-4 py-5 text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/30 p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Timeline Rail</p>
          <p className="mt-1 text-sm text-slate-300">
            Scroll across the dates and hover a marker to inspect the milestone.
          </p>
        </div>

        {timeline.undatedCount > 0 ? (
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-400">
            {timeline.undatedCount} undated {timeline.undatedCount === 1 ? "milestone" : "milestones"}
          </span>
        ) : null}
      </div>

      <div className="mt-5 overflow-x-auto overflow-y-visible pb-3 [scrollbar-gutter:stable]">
        <div className="relative px-8" style={{ width: timeline.width }}>
          <div className="relative h-52 min-w-full overflow-visible">
            <div className="absolute inset-x-8 top-28 h-px bg-gradient-to-r from-white/10 via-white/25 to-white/10" />

            <div
              className="absolute bottom-3 top-12 -translate-x-1/2"
              style={{ left: `${timeline.todayLeftPercent}%` }}
            >
              <div className="flex flex-col items-center">
                <span className="whitespace-nowrap rounded-full border border-rose-300/40 bg-rose-500/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-rose-100">
                  Today
                </span>
                <div className="mt-2 h-[5.9rem] w-px bg-rose-300/45" />
                <div className="h-2.5 w-2.5 rounded-full border border-rose-300/50 bg-rose-300 shadow-[0_0_0_4px_rgba(244,63,94,0.12)]" />
              </div>
            </div>

            {timeline.ticks.map((tick) => (
              <div
                key={tick.timestamp}
                className="absolute top-16 -translate-x-1/2"
                style={{ left: `${tick.leftPercent}%` }}
              >
                <div className="whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
                  {formatTickDate(tick.timestamp)}
                </div>
                <div className="mx-auto mt-2 h-3 w-px bg-white/15" />
              </div>
            ))}

            {timeline.items.map(({ milestone, leftPercent }) => {
              return (
                <div
                  key={milestone.id}
                  className="absolute top-[5.25rem] -translate-x-1/2"
                  style={{ left: `${leftPercent}%` }}
                >
                  <div className="group relative">
                    <button
                      type="button"
                      tabIndex={0}
                      aria-label={milestone.title}
                      onMouseEnter={(event) => openTooltip(milestone, event.currentTarget)}
                      onMouseLeave={closeTooltip}
                      onFocus={(event) => openTooltip(milestone, event.currentTarget)}
                      onBlur={closeTooltip}
                      className={`flex h-10 w-10 items-center justify-center border shadow-[0_10px_26px_rgba(2,6,23,0.32)] transition hover:-translate-y-0.5 hover:scale-[1.03] focus:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-white/60 [transform:rotate(45deg)] ${milestoneColorClass[milestone.color]}`}
                    >
                      <Flag className="h-4 w-4 [transform:rotate(-45deg)]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {activeTooltip && tooltipPosition && typeof document !== "undefined"
        ? createPortal(
            <div
              className="pointer-events-none fixed z-[80] w-64 rounded-xl border border-white/15 bg-slate-950/95 p-3 text-left shadow-[0_24px_64px_rgba(2,6,23,0.58)] backdrop-blur"
              style={{ left: tooltipPosition.left, top: tooltipPosition.top }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${milestoneColorClass[activeTooltip.milestone.color]}`}
                >
                  {activeTooltip.milestone.isComplete
                    ? "Complete"
                    : getMilestoneTypeLabel(activeTooltip.milestone.type)}
                </span>
                <span className="text-[11px] uppercase tracking-[0.08em] text-slate-500">
                  {formatDate(activeTooltip.milestone.dueAt as string)}
                </span>
              </div>

              <p className="mt-2 text-sm font-semibold text-white">{activeTooltip.milestone.title}</p>

              {getMilestoneDetail(activeTooltip.milestone) ? (
                <p className="mt-1 text-xs text-slate-300">{getMilestoneDetail(activeTooltip.milestone)}</p>
              ) : null}

              {activeTooltip.milestone.notes ? (
                <p className="mt-2 text-xs leading-5 text-slate-400">{activeTooltip.milestone.notes}</p>
              ) : null}
            </div>,
            document.body
          )
        : null}
    </div>
  );
};