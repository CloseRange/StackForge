export const deckColors = [
	"teal",
	"cyan",
	"amber",
	"rose",
	"indigo",
	"sky",
	"orange",
	"lime",
	"emerald"
] as const;

export type DeckColorValue = (typeof deckColors)[number];
