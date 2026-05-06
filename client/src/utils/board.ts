import type { CardPriority } from "../types/api";

export type BoardColumnId = "unclaimed" | "mine" | "claimed";

export const columnOrder: BoardColumnId[] = ["unclaimed", "mine", "claimed"];

export const columnLabels: Record<BoardColumnId, string> = {
  unclaimed: "Unclaimed",
  mine: "Mine",
  claimed: "Claimed"
};

export const rarityClasses: Record<CardPriority, string> = {
  common: "border-slate-500/80 shadow-slate-900/40",
  uncommon: "border-emerald-400/80 shadow-emerald-900/30",
  rare: "border-sky-400/80 shadow-sky-900/30",
  legendary: "border-amber-400/90 shadow-amber-900/30"
};
