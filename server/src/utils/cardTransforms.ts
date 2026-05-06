import type { SFCardWithChecklist } from "../models/cardModel.js";
import type { SFDeckRow } from "../models/deckModel.js";
import type { SFProjectWithCount } from "../models/projectModel.js";
import type { CardDifficultyValue, CardPriorityValue } from "../types/cards.js";

export const toCardPriority = (value: CardPriorityValue) => value.toUpperCase();
export const toCardDifficulty = (value: CardDifficultyValue) => value.toUpperCase();

const difficultyXpMap: Record<CardDifficultyValue, number> = {
  easy: 20,
  medium: 50,
  hard: 100,
  epic: 200
};

export const difficultyToXp = (difficulty: CardDifficultyValue) => difficultyXpMap[difficulty];

export const serializeCard = (card: SFCardWithChecklist) => ({
  id: card.id,
  title: card.title,
  description: card.description,
  priority: card.priority.toLowerCase(),
  difficulty: card.difficulty.toLowerCase(),
  xpValue: card.xp_value,
  assigneeId: card.assignee_id,
  boardSlot: card.board_slot,
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
  completionTargetDeckId: deck.completion_target_deck_id,
  name: deck.name,
  slug: deck.slug,
  description: deck.description,
  icon: deck.icon,
  color: deck.color,
  isAccessible: deck.is_accessible,
  allowAssignment: deck.allow_assignment,
  isSystem: deck.is_system,
  systemKey: deck.system_key,
  xpPayout: deck.xp_payout ?? 0,
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
