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

export type CardType = "feature" | "bug" | "refactor" | "docs" | "test";
export type CardPriority = "common" | "uncommon" | "rare" | "legendary";
export type CardStatus = "deck" | "in_play" | "blocked" | "review" | "completed";

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
  type: CardType;
  priority: CardPriority;
  difficulty: number;
  xpValue: number;
  status: CardStatus;
  assigneeId?: string | null;
  projectId: string;
  tags: string[];
  checklist: ChecklistItem[];
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
  type: CardType;
  priority: CardPriority;
  difficulty: number;
  xpValue?: number;
  status: CardStatus;
  assigneeId?: string | null;
  projectId: string;
  tags: string[];
  checklist: ChecklistItem[];
};

export type UpdateCardInput = Partial<Omit<CreateCardInput, "projectId">>;
