export const cardTypes = ["feature", "bug", "refactor", "docs", "test"] as const;
export const cardPriorities = ["common", "uncommon", "rare", "legendary"] as const;
export const cardStatuses = ["deck", "in_play", "blocked", "review", "completed"] as const;

export type CardTypeValue = (typeof cardTypes)[number];
export type CardPriorityValue = (typeof cardPriorities)[number];
export type CardStatusValue = (typeof cardStatuses)[number];
