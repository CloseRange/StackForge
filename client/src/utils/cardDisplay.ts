import type { CardDifficulty, CardPriority, AccountSettings } from "../types/api";

export type PriorityDisplayMode = "generic" | "rarity";
export type DifficultyDisplayMode = "generic" | "experience";

export type CardDisplaySettings = Pick<
  AccountSettings,
  | "showCardPriority"
  | "priorityDisplayMode"
  | "showCardDifficulty"
  | "difficultyDisplayMode"
>;

const priorityGenericLabels: Record<CardPriority, string> = {
  common: "Low Priority",
  uncommon: "Medium Priority",
  rare: "High Priority",
  legendary: "Very High Priority"
};

const priorityRarityLabels: Record<CardPriority, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  legendary: "Legendary"
};

const difficultyGenericLabels: Record<CardDifficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  epic: "Very Hard"
};

const difficultyExperienceLabels: Record<CardDifficulty, string> = {
  easy: "20 XP",
  medium: "50 XP",
  hard: "100 XP",
  epic: "200 XP"
};

export const defaultCardDisplaySettings: CardDisplaySettings = {
  showCardPriority: true,
  priorityDisplayMode: "rarity",
  showCardDifficulty: true,
  difficultyDisplayMode: "experience"
};

export const getPriorityLabel = (priority: CardPriority, mode: PriorityDisplayMode) => {
  return mode === "generic" ? priorityGenericLabels[priority] : priorityRarityLabels[priority];
};

export const getDifficultyLabel = (difficulty: CardDifficulty, mode: DifficultyDisplayMode) => {
  return mode === "generic" ? difficultyGenericLabels[difficulty] : difficultyExperienceLabels[difficulty];
};

export const getCardDisplaySettings = (settings: CardDisplaySettings | null | undefined) => ({
  showCardPriority: settings?.showCardPriority ?? defaultCardDisplaySettings.showCardPriority,
  priorityDisplayMode: settings?.priorityDisplayMode ?? defaultCardDisplaySettings.priorityDisplayMode,
  showCardDifficulty: settings?.showCardDifficulty ?? defaultCardDisplaySettings.showCardDifficulty,
  difficultyDisplayMode: settings?.difficultyDisplayMode ?? defaultCardDisplaySettings.difficultyDisplayMode
});
