import type { CardPriority } from "../types/api";

export type BoardColumnId = "unclaimed" | "mine" | "claimed";

export const columnOrder: BoardColumnId[] = ["unclaimed", "mine", "claimed"];

export const columnLabels: Record<BoardColumnId, string> = {
  unclaimed: "Unclaimed",
  mine: "Mine",
  claimed: "Claimed"
};

export const rarityClasses: Record<CardPriority, string> = {
  common: "border-slate-600/70 shadow-slate-950/40",
  uncommon: "border-emerald-400/60 shadow-emerald-950/30",
  rare: "border-sky-400/60 shadow-sky-950/30",
  legendary: "border-amber-400/70 shadow-amber-950/30"
};
