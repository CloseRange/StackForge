import type { Card, CardDifficulty, CardPriority, Deck, DeckColor, Project, User } from "../types/api";

export const demoDemoOwner: User = {
  id: "demo-user-1",
  email: "demo@example.com",
  displayName: "Alex Demo",
  firstName: "Alex",
  lastName: "Demo",
  userCode: "DEMO"
};

export const demoTeamMembers: User[] = [
  {
    id: "demo-user-2",
    email: "dev@example.com",
    displayName: "Jordan Dev",
    firstName: "Jordan",
    lastName: "Dev",
    userCode: "DEV"
  },
  {
    id: "demo-user-3",
    email: "design@example.com",
    displayName: "Casey Design",
    firstName: "Casey",
    lastName: "Design",
    userCode: "DES"
  },
  {
    id: "demo-user-4",
    email: "pm@example.com",
    displayName: "Morgan PM",
    firstName: "Morgan",
    lastName: "PM",
    userCode: "PM"
  }
];

export const demoProject: Project = {
  id: "demo-project-1",
  name: "StackForge Launch",
  description: "Building and launching the next generation of task management",
  icon: "rocket",
  maxCardsOnBoard: 12,
  slug: "stackforge-launch",
  createdAt: "2025-10-15T08:00:00Z",
  updatedAt: "2026-05-10T14:30:00Z",
  ownerId: demoDemoOwner.id,
  isPublic: false,
  cardCount: 24
};

export const demoDecks: Deck[] = [
  {
    id: "demo-deck-backlog",
    projectId: demoProject.id,
    completionTargetDeckId: "demo-deck-complete",
    name: "Backlog",
    slug: "backlog",
    description: "Cards waiting to be started",
    icon: "inbox",
    color: "teal" as DeckColor,
    isAccessible: true,
    allowAssignment: true,
    isSystem: true,
    systemKey: "backlog",
    xpPayout: 0,
    sortOrder: 1,
    createdAt: "2025-10-15T08:00:00Z",
    updatedAt: "2026-05-10T14:30:00Z"
  },
  {
    id: "demo-deck-in-progress",
    projectId: demoProject.id,
    completionTargetDeckId: "demo-deck-complete",
    name: "In Progress",
    slug: "in-progress",
    description: "Cards currently being worked on",
    icon: "zap",
    color: "amber" as DeckColor,
    isAccessible: true,
    allowAssignment: true,
    isSystem: true,
    systemKey: "in_progress",
    xpPayout: 0,
    sortOrder: 2,
    createdAt: "2025-10-15T08:00:00Z",
    updatedAt: "2026-05-10T14:30:00Z"
  },
  {
    id: "demo-deck-review",
    projectId: demoProject.id,
    completionTargetDeckId: "demo-deck-complete",
    name: "In Review",
    slug: "in-review",
    description: "Cards pending code review or QA",
    icon: "eye",
    color: "sky" as DeckColor,
    isAccessible: true,
    allowAssignment: true,
    isSystem: true,
    systemKey: "review",
    xpPayout: 0,
    sortOrder: 3,
    createdAt: "2025-10-15T08:00:00Z",
    updatedAt: "2026-05-10T14:30:00Z"
  },
  {
    id: "demo-deck-complete",
    projectId: demoProject.id,
    completionTargetDeckId: "demo-deck-complete",
    name: "Complete",
    slug: "complete",
    description: "Cards shipped and in production",
    icon: "trophy",
    color: "emerald" as DeckColor,
    isAccessible: true,
    allowAssignment: false,
    isSystem: true,
    systemKey: "complete",
    xpPayout: 100,
    sortOrder: 4,
    createdAt: "2025-10-15T08:00:00Z",
    updatedAt: "2026-05-10T14:30:00Z"
  },
  {
    id: "demo-deck-design",
    projectId: demoProject.id,
    completionTargetDeckId: "demo-deck-complete",
    name: "Design Review",
    slug: "design-review",
    description: "Design work and specifications",
    icon: "palette",
    color: "rose" as DeckColor,
    isAccessible: true,
    allowAssignment: true,
    isSystem: false,
    systemKey: null,
    xpPayout: 50,
    sortOrder: 5,
    createdAt: "2025-11-01T10:00:00Z",
    updatedAt: "2026-05-10T14:30:00Z"
  }
];

const createDemoCard = (
  id: string,
  title: string,
  description: string,
  difficulty: CardDifficulty,
  priority: CardPriority,
  deckId: string,
  assigneeId?: string,
  tags: string[] = []
): Card => {
  const assigneeUser = assigneeId
    ? demoTeamMembers.find((u) => u.id === assigneeId)
    : undefined;

  return {
    id,
    title,
    description: description || null,
    priority,
    difficulty,
    xpValue: { easy: 20, medium: 50, hard: 100, epic: 200 }[difficulty],
    assigneeId: assigneeId ?? null,
    boardSlot: assigneeId ? 1 : null,
    deckId,
    projectId: demoProject.id,
    tags,
    assignee: assigneeUser
      ? {
          id: assigneeUser.id,
          displayName: assigneeUser.displayName || assigneeUser.email,
          avatarUrl: null
        }
      : null,
    dependencies: [],
    isActive: deckId !== "demo-deck-backlog",
    blockedBy: [],
    checklist: [],
    createdAt: "2026-04-15T09:30:00Z",
    updatedAt: "2026-05-10T14:30:00Z"
  };
};

export const demoCards: Card[] = [
  // Backlog
  createDemoCard(
    "demo-card-1",
    "Implement notification preferences UI",
    "Add user-facing settings for notification types and frequency",
    "medium",
    "uncommon",
    "demo-deck-backlog",
    undefined,
    ["notifications", "settings"]
  ),
  createDemoCard(
    "demo-card-2",
    "Create project export functionality",
    "Allow users to export project data in multiple formats (JSON, CSV, PDF)",
    "hard",
    "uncommon",
    "demo-deck-backlog",
    undefined,
    ["export", "feature"]
  ),
  createDemoCard(
    "demo-card-3",
    "Setup analytics dashboard",
    "Track project metrics and team velocity",
    "epic",
    "rare",
    "demo-deck-backlog",
    undefined,
    ["analytics", "dashboard"]
  ),

  // In Progress
  createDemoCard(
    "demo-card-4",
    "Refactor authentication service",
    "Improve token handling and security",
    "medium",
    "common",
    "demo-deck-in-progress",
    demoTeamMembers[0]?.id,
    ["backend", "security"]
  ),
  createDemoCard(
    "demo-card-5",
    "Build real-time collaboration features",
    "Enable live updates when multiple users edit simultaneously",
    "hard",
    "legendary",
    "demo-deck-in-progress",
    demoTeamMembers[0]?.id,
    ["realtime", "collaboration"]
  ),
  createDemoCard(
    "demo-card-6",
    "Design new onboarding flow",
    "Create user tutorial for new members",
    "medium",
    "uncommon",
    "demo-deck-design",
    demoTeamMembers[1]?.id,
    ["design", "ux"]
  ),

  // In Review
  createDemoCard(
    "demo-card-7",
    "Add dark mode support",
    "Implement system theme detection and manual toggle",
    "easy",
    "common",
    "demo-deck-review",
    demoTeamMembers[1]?.id,
    ["frontend", "theme"]
  ),
  createDemoCard(
    "demo-card-8",
    "Database performance optimization",
    "Optimize slow queries and add proper indexing",
    "hard",
    "rare",
    "demo-deck-review",
    demoTeamMembers[0]?.id,
    ["backend", "performance"]
  ),
  createDemoCard(
    "demo-card-9",
    "Card details modal redesign",
    "Improve card editing UI and add keyboard shortcuts",
    "medium",
    "uncommon",
    "demo-deck-review",
    demoTeamMembers[1]?.id,
    ["frontend", "ui"]
  ),

  // Complete
  createDemoCard(
    "demo-card-10",
    "Implement role-based access control",
    "Add permission system for different user roles",
    "hard",
    "rare",
    "demo-deck-complete",
    demoTeamMembers[2]?.id,
    ["backend", "security", "rbac"]
  ),
  createDemoCard(
    "demo-card-11",
    "Setup email notifications",
    "Send notifications via email service",
    "medium",
    "uncommon",
    "demo-deck-complete",
    demoTeamMembers[0]?.id,
    ["backend", "notifications"]
  ),
  createDemoCard(
    "demo-card-12",
    "Create project templates",
    "Allow users to start from pre-made project layouts",
    "easy",
    "common",
    "demo-deck-complete",
    demoTeamMembers[1]?.id,
    ["feature", "templates"]
  ),
  createDemoCard(
    "demo-card-13",
    "Implement card dependencies",
    "Allow cards to block other cards from being started",
    "hard",
    "uncommon",
    "demo-deck-complete",
    demoTeamMembers[0]?.id,
    ["backend", "feature"]
  ),
  createDemoCard(
    "demo-card-14",
    "Add project milestones",
    "Create milestone tracking within projects",
    "medium",
    "uncommon",
    "demo-deck-complete",
    demoTeamMembers[2]?.id,
    ["feature", "milestones"]
  ),

  // Additional cards for variety
  createDemoCard(
    "demo-card-15",
    "Update API documentation",
    "Document all new endpoints and response formats",
    "easy",
    "common",
    "demo-deck-backlog",
    undefined,
    ["documentation"]
  ),
  createDemoCard(
    "demo-card-16",
    "Load testing and optimization",
    "Run load tests and optimize for scale",
    "epic",
    "rare",
    "demo-deck-backlog",
    undefined,
    ["performance", "devops"]
  ),
  createDemoCard(
    "demo-card-17",
    "Implement activity log",
    "Track all changes to cards and projects",
    "medium",
    "uncommon",
    "demo-deck-in-progress",
    demoTeamMembers[2]?.id,
    ["feature", "audit"]
  ),
  createDemoCard(
    "demo-card-18",
    "Create mobile responsive design",
    "Ensure all features work on mobile devices",
    "hard",
    "uncommon",
    "demo-deck-backlog",
    undefined,
    ["frontend", "mobile"]
  ),
  createDemoCard(
    "demo-card-19",
    "Setup automated testing pipeline",
    "Add CI/CD for automated test execution",
    "hard",
    "uncommon",
    "demo-deck-backlog",
    undefined,
    ["devops", "testing"]
  ),
  createDemoCard(
    "demo-card-20",
    "Implement bulk operations",
    "Allow batch editing and moving of multiple cards",
    "medium",
    "uncommon",
    "demo-deck-review",
    demoTeamMembers[1]?.id,
    ["feature", "ui"]
  ),
  createDemoCard(
    "demo-card-21",
    "Add search and filtering",
    "Full-text search and advanced filtering options",
    "medium",
    "uncommon",
    "demo-deck-complete",
    demoTeamMembers[0]?.id,
    ["feature", "search"]
  ),
  createDemoCard(
    "demo-card-22",
    "Create user feedback system",
    "Collect and manage user feature requests",
    "easy",
    "common",
    "demo-deck-complete",
    demoTeamMembers[1]?.id,
    ["feature", "engagement"]
  ),
  createDemoCard(
    "demo-card-23",
    "Implement webhook integrations",
    "Allow external services to trigger actions",
    "hard",
    "rare",
    "demo-deck-complete",
    demoTeamMembers[0]?.id,
    ["backend", "integrations"]
  ),
  createDemoCard(
    "demo-card-24",
    "Update branding and visual identity",
    "Refresh logos and design system",
    "medium",
    "uncommon",
    "demo-deck-design",
    demoTeamMembers[1]?.id,
    ["design", "branding"]
  )
];

export const getAllDemoData = () => ({
  owner: demoDemoOwner,
  project: demoProject,
  decks: demoDecks,
  cards: demoCards,
  teamMembers: demoTeamMembers
});
