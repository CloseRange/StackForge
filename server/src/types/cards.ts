export const cardPriorities = ["common", "uncommon", "rare", "legendary"] as const;
export const cardDifficulties = ["easy", "medium", "hard", "epic"] as const;

export type CardPriorityValue = (typeof cardPriorities)[number];
export type CardDifficultyValue = (typeof cardDifficulties)[number];
