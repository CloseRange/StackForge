import type { SFCardWithChecklist } from "../models/cardModel.js";
import type { SFDeckRow } from "../models/deckModel.js";
import type { SFProjectWithCount } from "../models/projectModel.js";
import type { CardPriorityValue, CardStatusValue, CardTypeValue } from "../types/cards.js";

// API value (lowercase) → DB enum value (uppercase)
export const toCardType = (value: CardTypeValue) => value.toUpperCase();
export const toCardPriority = (value: CardPriorityValue) => value.toUpperCase();
export const toCardStatus = (value: CardStatusValue) => value.toUpperCase();

export const difficultyToXp = (difficulty: number) => difficulty * 100;

export const serializeCard = (card: SFCardWithChecklist) => ({
  id: card.id,
  title: card.title,
  description: card.description,
  type: card.type.toLowerCase(),
  priority: card.priority.toLowerCase(),
  difficulty: card.difficulty,
  xpValue: card.xp_value,
  status: card.status.toLowerCase(),
  assigneeId: card.assignee_id,
  deckId: card.deck_id,
  projectId: card.project_id,
  tags: card.tags,
  checklist: [...card.checklist]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item) => ({
      id: item.id,
      label: item.label,
      completed: item.completed,
      sortOrder: item.sort_order
    })),
  createdAt: card.created_at,
  updatedAt: card.updated_at
});

export const serializeDeck = (deck: SFDeckRow) => ({
  id: deck.id,
  projectId: deck.project_id,
  name: deck.name,
  slug: deck.slug,
  description: deck.description,
  icon: deck.icon,
  color: deck.color,
  isSystem: deck.is_system,
  systemKey: deck.system_key,
  sortOrder: deck.sort_order,
  createdAt: deck.created_at,
  updatedAt: deck.updated_at
});

export const serializeProject = (project: SFProjectWithCount) => ({
  id: project.id,
  name: project.name,
  description: project.description,
  ownerId: project.owner_id,
  createdAt: project.created_at,
  updatedAt: project.updated_at,
  cardCount: Number(project.sf_cards?.[0]?.count ?? 0)
});
