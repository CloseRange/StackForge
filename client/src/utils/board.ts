import type { CardPriority, CardStatus, CardType } from "../types/api";

export const columnOrder: CardStatus[] = ["deck", "in_play", "blocked", "review", "completed"];

export const columnLabels: Record<CardStatus, string> = {
  deck: "Deck",
  in_play: "In Play",
  blocked: "Blocked",
  review: "Review",
  completed: "Victory"
};

export const rarityClasses: Record<CardPriority, string> = {
  common: "border-slate-600/70 shadow-slate-950/40",
  uncommon: "border-emerald-400/60 shadow-emerald-950/30",
  rare: "border-sky-400/60 shadow-sky-950/30",
  legendary: "border-amber-400/70 shadow-amber-950/30"
};

export const typeLabels: Record<CardType, string> = {
  feature: "Feature",
  bug: "Bug",
  refactor: "Refactor",
  docs: "Docs",
  test: "Test"
};
