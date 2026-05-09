import { supabaseAdmin } from "../config/db.js";
import { AppError } from "../middleware/errorHandler.js";
import type { SFCardWithChecklist } from "../models/cardModel.js";
import type { SFDeckRow } from "../models/deckModel.js";
import type { SFProjectMilestoneRow } from "../models/milestoneModel.js";
import type { SFProjectRow } from "../models/projectModel.js";
import { serializeDeck } from "../utils/cardTransforms.js";

const CARD_SELECT = "*, checklist:sf_checklist_items(*)" as const;

const serializePublicCard = (card: SFCardWithChecklist) => ({
  id: card.id,
  title: card.title,
  description: card.description,
  priority: card.priority.toLowerCase(),
  difficulty: card.difficulty.toLowerCase(),
  xpValue: card.xp_value,
  boardSlot: card.board_slot,
  deckId: card.deck_id,
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

const serializePublicMilestone = (
  milestone: SFProjectMilestoneRow,
  cards: SFCardWithChecklist[],
  decks: SFDeckRow[]
) => {
  const deckById = new Map(decks.map((deck) => [deck.id, deck]));
  const cardById = new Map(cards.map((card) => [card.id, card]));
  const completedDeckId = decks.find((deck) => deck.system_key === "COMPLETED")?.id ?? null;

  const totalXp = cards.reduce((sum, card) => sum + (card.xp_value ?? 0), 0);
  const earnedXp = cards.reduce((sum, card) => {
    const payout = deckById.get(card.deck_id)?.xp_payout ?? 0;
    return sum + Math.round((card.xp_value * payout) / 100);
  }, 0);

  const targetCard = milestone.target_card_id ? cardById.get(milestone.target_card_id) : null;
  const targetDeck = milestone.target_deck_id ? deckById.get(milestone.target_deck_id) : null;

  let isComplete = false;

  if (milestone.type === "CARD") {
    isComplete = Boolean(targetCard && completedDeckId && targetCard.deck_id === completedDeckId);
  } else if (milestone.type === "DECK") {
    isComplete = Boolean(targetDeck) && !cards.some((card) => card.deck_id === milestone.target_deck_id);
  } else if (milestone.type === "XP") {
    isComplete = earnedXp >= (milestone.target_xp ?? 0);
  } else if (milestone.type === "PROJECT") {
    isComplete = totalXp > 0 && earnedXp >= totalXp;
  }

  return {
    id: milestone.id,
    projectId: milestone.project_id,
    type: milestone.type.toLowerCase(),
    color: milestone.color ?? "sky",
    icon: milestone.icon ?? "flag",
    title: milestone.title ?? "Milestone",
    dueAt: milestone.due_at,
    targetCardId: milestone.target_card_id,
    targetCardTitle: targetCard?.title ?? null,
    targetDeckId: milestone.target_deck_id,
    targetDeckName: targetDeck?.name ?? null,
    targetXp: milestone.target_xp,
    notes: milestone.notes,
    isComplete,
    progress: {
      totalXp,
      earnedXp
    },
    createdAt: milestone.created_at,
    updatedAt: milestone.updated_at
  };
};

export const publicService = {
  async getPublicProject(userCode: string, projectSlug: string) {
    // Resolve user from 4-char code via RPC
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc(
      "sf_find_user_by_code",
      { p_code: userCode.toUpperCase() }
    );

    if (rpcError || !rpcData) {
      throw new AppError("Project not found", 404);
    }

    const ownerId = rpcData as string;

    const { data: project, error: projectError } = await supabaseAdmin
      .from("sf_projects")
      .select("*")
      .eq("owner_id", ownerId)
      .eq("slug", projectSlug)
      .single();

    if (projectError || !project) {
      throw new AppError("Project not found", 404);
    }

    if (!(project as SFProjectRow).is_public) {
      throw new AppError("This project is not publicly shared", 403);
    }

    const { data: decks, error: decksError } = await supabaseAdmin
      .from("sf_decks")
      .select("*")
      .eq("project_id", (project as SFProjectRow).id)
      .order("sort_order", { ascending: true });

    if (decksError) {
      throw new AppError(decksError.message, 500);
    }

    const { data: cards, error: cardsError } = await supabaseAdmin
      .from("sf_cards")
      .select(CARD_SELECT)
      .eq("project_id", (project as SFProjectRow).id)
      .order("created_at", { ascending: false });

    if (cardsError) {
      throw new AppError(cardsError.message, 500);
    }

    const { data: milestones, error: milestonesError } = await supabaseAdmin
      .from("sf_project_milestones")
      .select("*")
      .eq("project_id", (project as SFProjectRow).id)
      .order("due_at", { ascending: true })
      .order("created_at", { ascending: true });

    if (milestonesError) {
      throw new AppError(milestonesError.message, 500);
    }

    const row = project as SFProjectRow;
    const cardRows = (cards as SFCardWithChecklist[]) ?? [];
    const deckRows = (decks as SFDeckRow[]) ?? [];

    return {
      project: {
        id: row.id,
        name: row.name,
        description: row.description,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      },
      decks: deckRows.map(serializeDeck),
      cards: cardRows.map(serializePublicCard),
      milestones: ((milestones ?? []) as SFProjectMilestoneRow[]).map((milestone) =>
        serializePublicMilestone(milestone, cardRows, deckRows)
      )
    };
  }
};
