import { supabaseAdmin } from "../config/db.js";
import { AppError } from "../middleware/errorHandler.js";
import type { SFCardWithChecklist } from "../models/cardModel.js";
import {
  difficultyToXp,
  serializeCard,
  toCardPriority,
  toCardStatus,
  toCardType
} from "../utils/cardTransforms.js";
import {
  assignCardSchema,
  createCardSchema,
  moveCardSchema,
  updateCardSchema
} from "../utils/validators.js";

const CARD_SELECT = "*, checklist:sf_checklist_items(*)" as const;

const ensureProjectAccess = async (projectId: string, userId: string) => {
  const { data } = await supabaseAdmin
    .from("sf_projects")
    .select("id")
    .eq("id", projectId)
    .eq("owner_id", userId)
    .single();

  if (!data) {
    throw new AppError("Project not found", 404);
  }
};

const ensureDeckForProject = async (deckId: string | null | undefined, projectId: string) => {
  if (!deckId) {
    return null;
  }

  const { data } = await supabaseAdmin
    .from("sf_decks")
    .select("id, is_accessible, allow_assignment")
    .eq("id", deckId)
    .eq("project_id", projectId)
    .single();

  if (!data) {
    throw new AppError("Deck not found for this project", 400);
  }

  return data as { id: string; is_accessible: boolean; allow_assignment: boolean };
};

const ensureDeckCanAssign = (
  deck: { is_accessible: boolean; allow_assignment: boolean } | null,
  isAssigning: boolean
) => {
  if (!isAssigning) {
    return;
  }

  if (deck && (!deck.is_accessible || !deck.allow_assignment)) {
    throw new AppError("Cards in this deck cannot be assigned", 400);
  }
};

const fetchCardForUser = async (cardId: string, userId: string) => {
  const { data: card } = await supabaseAdmin
    .from("sf_cards")
    .select(CARD_SELECT)
    .eq("id", cardId)
    .single();

  if (!card) {
    throw new AppError("Card not found", 404);
  }

  const { data: project } = await supabaseAdmin
    .from("sf_projects")
    .select("id")
    .eq("id", (card as SFCardWithChecklist).project_id)
    .eq("owner_id", userId)
    .single();

  if (!project) {
    throw new AppError("Card not found", 404);
  }

  return card as SFCardWithChecklist;
};

const ensureAssignee = async (assigneeId: string | null | undefined) => {
  if (!assigneeId) {
    return null;
  }

  const { data } = await supabaseAdmin.auth.admin.getUserById(assigneeId);

  if (!data.user) {
    throw new AppError("Assignee not found", 404);
  }

  return assigneeId;
};

const fetchCardById = async (cardId: string) => {
  const { data, error } = await supabaseAdmin
    .from("sf_cards")
    .select(CARD_SELECT)
    .eq("id", cardId)
    .single();

  if (error || !data) {
    throw new AppError("Card not found", 404);
  }

  return data as SFCardWithChecklist;
};

const ensureCardClaimIsMutable = (
  card: SFCardWithChecklist,
  userId: string,
  options: { isChangingStatus?: boolean; isChangingAssignee?: boolean }
) => {
  if (!card.assignee_id || card.assignee_id === userId) {
    return;
  }

  if (options.isChangingStatus || options.isChangingAssignee) {
    throw new AppError("This card is already claimed on another board", 409);
  }
};

const replaceChecklist = async (
  cardId: string,
  items: { label: string; completed: boolean }[]
) => {
  await supabaseAdmin.from("sf_checklist_items").delete().eq("card_id", cardId);

  if (items.length > 0) {
    await supabaseAdmin.from("sf_checklist_items").insert(
      items.map((item, index) => ({
        card_id: cardId,
        label: item.label,
        completed: item.completed,
        sort_order: index
      }))
    );
  }
};

export const cardService = {
  async listByProject(projectId: string, userId: string) {
    await ensureProjectAccess(projectId, userId);

    const { data, error } = await supabaseAdmin
      .from("sf_cards")
      .select(CARD_SELECT)
      .eq("project_id", projectId)
      .order("status")
      .order("updated_at", { ascending: false });

    if (error) {
      throw new AppError(error.message, 500);
    }

    return (data as SFCardWithChecklist[]).map(serializeCard);
  },

  async create(userId: string, payload: unknown) {
    const input = createCardSchema.parse(payload);
    await ensureProjectAccess(input.projectId, userId);
    const assigneeId = await ensureAssignee(input.assigneeId);
    const deck = await ensureDeckForProject(input.deckId, input.projectId);
    ensureDeckCanAssign(deck, Boolean(assigneeId));

    const { data: card, error } = await supabaseAdmin
      .from("sf_cards")
      .insert({
        title: input.title,
        description: input.description || null,
        type: toCardType(input.type),
        priority: toCardPriority(input.priority),
        difficulty: input.difficulty,
        xp_value: input.xpValue ?? difficultyToXp(input.difficulty),
        status: toCardStatus(input.status),
        assignee_id: assigneeId,
        project_id: input.projectId,
        deck_id: deck?.id ?? null,
        tags: input.tags
      })
      .select("id")
      .single();

    if (error || !card) {
      throw new AppError(error?.message ?? "Failed to create card", 500);
    }

    if (input.checklist.length > 0) {
      await replaceChecklist(card.id, input.checklist);
    }

    return serializeCard(await fetchCardById(card.id));
  },

  async update(cardId: string, userId: string, payload: unknown) {
    const input = updateCardSchema.parse(payload);
    const existingCard = await fetchCardForUser(cardId, userId);

    ensureCardClaimIsMutable(existingCard, userId, {
      isChangingStatus: input.status !== undefined,
      isChangingAssignee: input.assigneeId !== undefined
    });

    const updateFields: Record<string, unknown> = {};
    if (input.title !== undefined) updateFields["title"] = input.title;
    if (input.description !== undefined) updateFields["description"] = input.description || null;
    if (input.type !== undefined) updateFields["type"] = toCardType(input.type);
    if (input.priority !== undefined) updateFields["priority"] = toCardPriority(input.priority);
    if (input.difficulty !== undefined) updateFields["difficulty"] = input.difficulty;
    if (input.xpValue !== undefined) updateFields["xp_value"] = input.xpValue;
    else if (input.difficulty !== undefined) updateFields["xp_value"] = difficultyToXp(input.difficulty);
    if (input.status !== undefined) updateFields["status"] = toCardStatus(input.status);
    if (input.tags !== undefined) updateFields["tags"] = input.tags;
    const nextAssigneeId =
      input.assigneeId !== undefined ? await ensureAssignee(input.assigneeId) : existingCard.assignee_id;

    if (input.assigneeId !== undefined) {
      updateFields["assignee_id"] = nextAssigneeId;
    }

    let nextDeck = existingCard.deck_id
      ? await ensureDeckForProject(existingCard.deck_id, existingCard.project_id)
      : null;

    if (input.deckId !== undefined) {
      nextDeck = await ensureDeckForProject(input.deckId, existingCard.project_id);
      updateFields["deck_id"] = nextDeck?.id ?? null;
    }

    ensureDeckCanAssign(nextDeck, Boolean(nextAssigneeId));

    if (Object.keys(updateFields).length > 0) {
      const { error } = await supabaseAdmin
        .from("sf_cards")
        .update(updateFields)
        .eq("id", cardId);

      if (error) {
        throw new AppError(error.message, 500);
      }
    }

    if (input.checklist !== undefined) {
      await replaceChecklist(cardId, input.checklist);
    }

    return serializeCard(await fetchCardById(cardId));
  },

  async move(cardId: string, userId: string, payload: unknown) {
    const input = moveCardSchema.parse(payload);
    const existingCard = await fetchCardForUser(cardId, userId);

    ensureCardClaimIsMutable(existingCard, userId, { isChangingStatus: true });

    const { error } = await supabaseAdmin
      .from("sf_cards")
      .update({ status: toCardStatus(input.status) })
      .eq("id", cardId);

    if (error) {
      throw new AppError(error.message, 500);
    }

    return serializeCard(await fetchCardById(cardId));
  },

  async assign(cardId: string, userId: string, payload: unknown) {
    const input = assignCardSchema.parse(payload);
    const existingCard = await fetchCardForUser(cardId, userId);

    ensureCardClaimIsMutable(existingCard, userId, { isChangingAssignee: true });

    const deck = existingCard.deck_id
      ? await ensureDeckForProject(existingCard.deck_id, existingCard.project_id)
      : null;
    const nextAssigneeId = await ensureAssignee(input.assigneeId);

    ensureDeckCanAssign(deck, Boolean(nextAssigneeId));

    const { error } = await supabaseAdmin
      .from("sf_cards")
      .update({ assignee_id: nextAssigneeId })
      .eq("id", cardId);

    if (error) {
      throw new AppError(error.message, 500);
    }

    return serializeCard(await fetchCardById(cardId));
  },

  async remove(cardId: string, userId: string) {
    await fetchCardForUser(cardId, userId);

    const { error } = await supabaseAdmin
      .from("sf_cards")
      .delete()
      .eq("id", cardId);

    if (error) {
      throw new AppError(error.message, 500);
    }
  }
};
