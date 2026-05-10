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
  icon?: string | null;
  maxCardsOnBoard: number;
  slug: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  isPublic: boolean;
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

export type CardDependency = {
  dependsOnCardId: string;
  requiredDeckId: string | null;
  dependsOnCardTitle: string;
  requiredDeckName: string;
  isSatisfied: boolean;
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
  dependencies: CardDependency[];
  isActive: boolean;
  blockedBy: string[];
  checklist: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
};

export type DeckColor =
  | "teal"
  | "cyan"
  | "amber"
  | "rose"
  | "indigo"
  | "sky"
  | "orange"
  | "lime"
  | "emerald";

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

export type ThemePreference = "system" | "light" | "dark";

export type AccountSettings = {
  theme: ThemePreference;
  aliasName: string;
  emailMentions: boolean;
  weeklyDigest: boolean;
  desktopAlerts: boolean;
  compactBoardCards: boolean;
  showCardDetails: boolean;
  showCardPriority: boolean;
  priorityDisplayMode: "generic" | "rarity";
  showCardDifficulty: boolean;
  difficultyDisplayMode: "generic" | "experience";
  notifyMilestoneDueSoon: boolean;
  notifyMilestoneCompleted: boolean;
  notifyAddedToProject: boolean;
  notifyAssignedCardChanged: boolean;
  notifyProjectMemberJoined: boolean;
};

export type UpdateAccountSettingsInput = Partial<AccountSettings>;

export type NotificationType =
  | "welcome"
  | "milestone_due_soon"
  | "milestone_completed"
  | "added_to_project"
  | "assigned_card_changed"
  | "project_member_joined";

export type NotificationItem = {
  id: string;
  userId: string;
  projectId: string | null;
  type: NotificationType;
  title: string;
  body: string;
  payload: Record<string, unknown>;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
};

export type NotificationsResponse = {
  notifications: NotificationItem[];
  unreadCount: number;
};

export type CreateProjectInput = {
  name: string;
  description?: string;
  icon?: string;
  maxCardsOnBoard?: number;
};

export type UpdateProjectInput = {
  name?: string;
  description?: string;
  icon?: string;
  maxCardsOnBoard?: number;
  isPublic?: boolean;
};

export type ProjectMember = {
  id: string;
  role: string;
  roleId: string | null;
  displayName: string;
  firstName: string;
  lastName: string;
  statusMessage: string;
  userCode: string | null;
  avatarUrl: string | null;
  joinedAt?: string;
};

export type ProjectRole = {
  id: string;
  name: string;
  displayName?: string;
  isSystem: boolean;
  memberCount: number;
  deckReadMode?: "FULL_ACCESS" | "NO_ACCESS" | "WHITELIST" | "BLACKLIST";
  deckReadDeckIds?: string[];
  deckWriteMode?: "FULL_ACCESS" | "NO_ACCESS" | "WHITELIST" | "BLACKLIST";
  deckWriteDeckIds?: string[];
  canManageDecks?: boolean;
};

export type ProjectMembersResponse = {
  ownerId: string | null;
  owner: ProjectMember | null;
  members: ProjectMember[];
  roles?: ProjectRole[];
};

export type ProjectActivityChange = {
  field: string;
  label: string;
  before: unknown;
  after: unknown;
};

export type ProjectActivityEvent = {
  id: string;
  projectId: string;
  action: string;
  entityType: "project" | "deck" | "card" | "member";
  entityId: string | null;
  entityLabel: string | null;
  summary: string;
  actor: {
    id: string | null;
    displayName: string;
    userCode: string | null;
    avatarUrl: string | null;
  };
  changes: ProjectActivityChange[];
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type ProjectActivityResponse = {
  events: ProjectActivityEvent[];
  total: number;
  filteredTotal: number;
  last7Days: number;
};

export type ProjectUserNote = {
  id: string;
  projectId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type MilestoneType = "card" | "deck" | "xp" | "project";
export type MilestoneColor = "sky" | "amber" | "emerald" | "rose" | "violet";

export type ProjectMilestone = {
  id: string;
  projectId: string;
  type: MilestoneType;
  color: MilestoneColor;
  icon: string;
  title: string;
  dueAt: string | null;
  targetCardId: string | null;
  targetCardTitle: string | null;
  targetDeckId: string | null;
  targetDeckName: string | null;
  targetXp: number | null;
  notes: string | null;
  isComplete: boolean;
  progress: {
    totalXp: number;
    earnedXp: number;
  };
  createdAt: string;
  updatedAt: string;
};

export type CreateMilestoneInput = {
  type: MilestoneType;
  color?: MilestoneColor;
  icon?: string;
  title?: string;
  dueAt?: string | null;
  targetCardId?: string;
  targetDeckId?: string;
  targetXp?: number;
  notes?: string;
};

export type UpdateMilestoneInput = {
  color?: MilestoneColor;
  icon?: string;
  title?: string;
  dueAt?: string | null;
  targetCardId?: string | null;
  targetDeckId?: string | null;
  targetXp?: number;
  notes?: string;
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
  dependencies?: Array<{
    dependsOnCardId: string;
    requiredDeckId?: string | null;
  }>;
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
