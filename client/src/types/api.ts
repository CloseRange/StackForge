export type User = {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string | null;
};

export type Project = {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  cardCount: number;
};

export type CardPriority = "common" | "uncommon" | "rare" | "legendary";
export type CardDifficulty = "easy" | "medium" | "hard" | "epic";

export type ChecklistItem = {
  id?: string;
  label: string;
  completed: boolean;
  sortOrder?: number;
};

export type Card = {
  id: string;
  title: string;
  description?: string | null;
  priority: CardPriority;
  difficulty: CardDifficulty;
  xpValue: number;
  assigneeId?: string | null;
  boardSlot?: number | null;
  deckId: string;
  projectId: string;
  tags: string[];
  checklist: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
};

export type DeckColor = "teal" | "cyan" | "amber" | "rose" | "indigo" | "emerald";

export type Deck = {
  id: string;
  projectId: string;
  completionTargetDeckId: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  color: DeckColor;
  isAccessible: boolean;
  allowAssignment: boolean;
  isSystem: boolean;
  systemKey?: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type AuthPayload = {
  token: string;
  user: User;
};

export type CreateProjectInput = {
  name: string;
  description?: string;
};

export type CreateCardInput = {
  title: string;
  description?: string;
  priority: CardPriority;
  difficulty: CardDifficulty;
  assigneeId?: string | null;
  boardSlot?: number | null;
  deckId: string;
  projectId: string;
  tags: string[];
  checklist: ChecklistItem[];
};

export type UpdateCardInput = Partial<Omit<CreateCardInput, "projectId">>;

export type CreateDeckInput = {
  projectId: string;
  completionTargetDeckId?: string;
  name: string;
  description?: string;
  icon?: string;
  color: Exclude<DeckColor, "emerald">;
  isAccessible?: boolean;
  allowAssignment?: boolean;
};

export type UpdateDeckInput = Partial<Omit<CreateDeckInput, "projectId">>;
