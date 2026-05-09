import { supabaseAdmin } from "../config/db.js";
import { AppError } from "../middleware/errorHandler.js";
import type { SFCardRow } from "../models/cardModel.js";
import type { SFDeckRow } from "../models/deckModel.js";
import type { MilestoneType, SFProjectMilestoneRow } from "../models/milestoneModel.js";
import { ensureProjectAccess } from "../utils/projectAccess.js";
import { createMilestoneSchema, updateMilestoneSchema } from "../utils/validators.js";

type MilestoneCardRow = Pick<SFCardRow, "id" | "title" | "deck_id" | "xp_value">;
type MilestoneDeckRow = Pick<SFDeckRow, "id" | "name" | "system_key" | "xp_payout">;

const getMilestoneContext = async (projectId: string) => {
  const [{ data: decks, error: decksError }, { data: cards, error: cardsError }] = await Promise.all([
    supabaseAdmin
      .from("sf_decks")
      .select("id, name, system_key, xp_payout")
      .eq("project_id", projectId),
    supabaseAdmin
      .from("sf_cards")
      .select("id, title, deck_id, xp_value")
      .eq("project_id", projectId)
  ]);

  if (decksError) {
    throw new AppError(decksError.message, 500);
  }

  if (cardsError) {
    throw new AppError(cardsError.message, 500);
  }

  const deckRows = (decks ?? []) as MilestoneDeckRow[];
  const cardRows = (cards ?? []) as MilestoneCardRow[];
  const completedDeckId = deckRows.find((deck) => deck.system_key === "COMPLETED")?.id ?? null;

  const payoutByDeckId = new Map(deckRows.map((deck) => [deck.id, deck.xp_payout ?? 0]));
  const totalXp = cardRows.reduce((sum, card) => sum + (card.xp_value ?? 0), 0);
  const earnedXp = cardRows.reduce((sum, card) => {
    const payout = payoutByDeckId.get(card.deck_id) ?? 0;
    return sum + Math.round((card.xp_value * payout) / 100);
  }, 0);

  return {
    deckRows,
    cardRows,
    completedDeckId,
    totalXp,
    earnedXp
  };
};

const defaultMilestoneTitle = (
  row: SFProjectMilestoneRow,
  cardsById: Map<string, MilestoneCardRow>,
  decksById: Map<string, MilestoneDeckRow>
) => {
  if (row.type === "CARD") {
    const card = row.target_card_id ? cardsById.get(row.target_card_id) : null;
    return card ? `Card complete: ${card.title}` : "Card completion";
  }

  if (row.type === "DECK") {
    const deck = row.target_deck_id ? decksById.get(row.target_deck_id) : null;
    return deck ? `Deck clear: ${deck.name}` : "Deck completion";
  }

  if (row.type === "XP") {
    return `Reach ${row.target_xp ?? 0} XP`;
  }

  return "Project complete";
};

const serializeMilestone = (
  row: SFProjectMilestoneRow,
  context: {
    deckRows: MilestoneDeckRow[];
    cardRows: MilestoneCardRow[];
    completedDeckId: string | null;
    totalXp: number;
    earnedXp: number;
  }
) => {
  const decksById = new Map(context.deckRows.map((deck) => [deck.id, deck]));
  const cardsById = new Map(context.cardRows.map((card) => [card.id, card]));

  let isComplete = false;

  if (row.type === "CARD") {
    const card = row.target_card_id ? cardsById.get(row.target_card_id) : null;
    isComplete = Boolean(card && context.completedDeckId && card.deck_id === context.completedDeckId);
  } else if (row.type === "DECK") {
    isComplete =
      Boolean(row.target_deck_id) &&
      !context.cardRows.some((card) => card.deck_id === row.target_deck_id);
  } else if (row.type === "XP") {
    isComplete = context.earnedXp >= (row.target_xp ?? 0);
  } else if (row.type === "PROJECT") {
    isComplete = context.totalXp > 0 && context.earnedXp >= context.totalXp;
  }

  const card = row.target_card_id ? cardsById.get(row.target_card_id) : null;
  const deck = row.target_deck_id ? decksById.get(row.target_deck_id) : null;
  const title = row.title?.trim() ? row.title.trim() : defaultMilestoneTitle(row, cardsById, decksById);

  return {
    id: row.id,
    projectId: row.project_id,
    type: row.type.toLowerCase(),
    color: row.color ?? "sky",
    icon: row.icon ?? "flag",
    title,
    dueAt: row.due_at,
    targetCardId: row.target_card_id,
    targetCardTitle: card?.title ?? null,
    targetDeckId: row.target_deck_id,
    targetDeckName: deck?.name ?? null,
    targetXp: row.target_xp,
    notes: row.notes,
    isComplete,
    progress: {
      totalXp: context.totalXp,
      earnedXp: context.earnedXp
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

const assertCardInProject = async (projectId: string, cardId: string) => {
  const { data } = await supabaseAdmin
    .from("sf_cards")
    .select("id")
    .eq("id", cardId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (!data) {
    throw new AppError("Card milestone target is not in this project", 400);
  }
};

const assertDeckInProject = async (projectId: string, deckId: string) => {
  const { data } = await supabaseAdmin
    .from("sf_decks")
    .select("id")
    .eq("id", deckId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (!data) {
    throw new AppError("Deck milestone target is not in this project", 400);
  }
};

const parseDueAt = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  const dueAt = new Date(value);

  if (Number.isNaN(dueAt.getTime())) {
    throw new AppError("Invalid milestone due date", 400);
  }

  return dueAt.toISOString();
};

const fetchMilestone = async (projectId: string, milestoneId: string) => {
  const { data, error } = await supabaseAdmin
    .from("sf_project_milestones")
    .select("*")
    .eq("project_id", projectId)
    .eq("id", milestoneId)
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, 500);
  }

  if (!data) {
    throw new AppError("Milestone not found", 404);
  }

  return data as SFProjectMilestoneRow;
};

export const milestoneService = {
  async listByProject(projectId: string, userId: string) {
    await ensureProjectAccess(projectId, userId);

    const [{ data, error }, context] = await Promise.all([
      supabaseAdmin
        .from("sf_project_milestones")
        .select("*")
        .eq("project_id", projectId)
        .order("due_at", { ascending: true })
        .order("created_at", { ascending: true }),
      getMilestoneContext(projectId)
    ]);

    if (error) {
      throw new AppError(error.message, 500);
    }

    return ((data ?? []) as SFProjectMilestoneRow[]).map((row) => serializeMilestone(row, context));
  },

  async create(projectId: string, userId: string, payload: unknown) {
    await ensureProjectAccess(projectId, userId);
    const input = createMilestoneSchema.parse(payload);

    if (input.type === "card" && input.targetCardId) {
      await assertCardInProject(projectId, input.targetCardId);
    }

    if (input.type === "deck" && input.targetDeckId) {
      await assertDeckInProject(projectId, input.targetDeckId);
    }

    const { data, error } = await supabaseAdmin
      .from("sf_project_milestones")
      .insert({
        project_id: projectId,
        type: input.type.toUpperCase() as MilestoneType,
        color: input.color,
        icon: input.icon,
        title: input.title?.trim() || null,
        due_at: parseDueAt(input.dueAt),
        target_card_id: input.targetCardId ?? null,
        target_deck_id: input.targetDeckId ?? null,
        target_xp: input.targetXp ?? null,
        notes: input.notes?.trim() || null
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new AppError(error?.message ?? "Failed to create milestone", 500);
    }

    const context = await getMilestoneContext(projectId);
    return serializeMilestone(data as SFProjectMilestoneRow, context);
  },

  async update(projectId: string, milestoneId: string, userId: string, payload: unknown) {
    await ensureProjectAccess(projectId, userId);
    const input = updateMilestoneSchema.parse(payload);
    const existing = await fetchMilestone(projectId, milestoneId);

    const type = existing.type.toLowerCase();

    if (type === "card" && input.targetCardId) {
      await assertCardInProject(projectId, input.targetCardId);
    }

    if (type === "deck" && input.targetDeckId) {
      await assertDeckInProject(projectId, input.targetDeckId);
    }

    const updateFields: Record<string, unknown> = {};

    if (input.title !== undefined) {
      updateFields["title"] = input.title?.trim() || null;
    }

    if (input.color !== undefined) {
      updateFields["color"] = input.color;
    }

    if (input.icon !== undefined) {
      updateFields["icon"] = input.icon;
    }

    if (input.notes !== undefined) {
      updateFields["notes"] = input.notes?.trim() || null;
    }

    if (input.dueAt !== undefined) {
      updateFields["due_at"] = parseDueAt(input.dueAt);
    }

    if (type === "card" && input.targetCardId !== undefined) {
      updateFields["target_card_id"] = input.targetCardId;
    }

    if (type === "deck" && input.targetDeckId !== undefined) {
      updateFields["target_deck_id"] = input.targetDeckId;
    }

    if (type === "xp" && input.targetXp !== undefined) {
      updateFields["target_xp"] = input.targetXp;
    }

    const { data, error } = await supabaseAdmin
      .from("sf_project_milestones")
      .update(updateFields)
      .eq("id", milestoneId)
      .eq("project_id", projectId)
      .select("*")
      .single();

    if (error || !data) {
      throw new AppError(error?.message ?? "Failed to update milestone", 500);
    }

    const context = await getMilestoneContext(projectId);
    return serializeMilestone(data as SFProjectMilestoneRow, context);
  },

  async remove(projectId: string, milestoneId: string, userId: string) {
    await ensureProjectAccess(projectId, userId);
    await fetchMilestone(projectId, milestoneId);

    const { error } = await supabaseAdmin
      .from("sf_project_milestones")
      .delete()
      .eq("project_id", projectId)
      .eq("id", milestoneId);

    if (error) {
      throw new AppError(error.message, 500);
    }
  }
};
