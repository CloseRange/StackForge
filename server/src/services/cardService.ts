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
    await fetchCardForUser(cardId, userId);

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
    if (input.assigneeId !== undefined) {
      updateFields["assignee_id"] = await ensureAssignee(input.assigneeId);
    }

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
    await fetchCardForUser(cardId, userId);

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
    await fetchCardForUser(cardId, userId);

    const { error } = await supabaseAdmin
      .from("sf_cards")
      .update({ assignee_id: await ensureAssignee(input.assigneeId) })
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
