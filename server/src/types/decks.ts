export const deckColors = ["teal", "cyan", "amber", "rose", "indigo", "emerald"] as const;

export type DeckColorValue = (typeof deckColors)[number];
