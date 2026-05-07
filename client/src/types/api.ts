export type User = {
  id: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  statusMessage?: string;
  userCode?: string;
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
  assignee?: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  } | null;
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
  xpPayout: number;
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

export type ProjectMember = {
  id: string;
  role: string;
  displayName: string;
  firstName: string;
  lastName: string;
  statusMessage: string;
  userCode: string | null;
  avatarUrl: string | null;
  joinedAt?: string;
  deckReadMode: "FULL_ACCESS" | "NO_ACCESS" | "WHITELIST" | "BLACKLIST";
  deckReadDeckIds: string[];
  deckWriteMode: "FULL_ACCESS" | "NO_ACCESS" | "WHITELIST" | "BLACKLIST";
  deckWriteDeckIds: string[];
};

export type ProjectMembersResponse = {
  ownerId: string | null;
  owner: ProjectMember | null;
  members: ProjectMember[];
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
  xpPayout?: number;
};

export type UpdateDeckInput = Partial<Omit<CreateDeckInput, "projectId">>;
