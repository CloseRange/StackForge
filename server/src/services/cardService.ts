import { supabaseAdmin } from "../config/db.js";
import { env } from "../config/env.js";
import { AppError } from "../middleware/errorHandler.js";
import type { SFCardWithChecklist } from "../models/cardModel.js";
import { activityService, buildActivityChanges } from "./activityService.js";
import {
  difficultyToXp,
  serializeCard,
  toCardDifficulty,
  toCardPriority
} from "../utils/cardTransforms.js";
import { canReadDeck, canWriteDeck, getProjectMemberPolicy } from "../utils/memberPermissions.js";
import { ensureProjectAccess } from "../utils/projectAccess.js";
import {
  assignCardSchema,
  createCardSchema,
  updateCardSchema
} from "../utils/validators.js";

const CARD_SELECT = "*, checklist:sf_checklist_items(*)" as const;

const CARD_ACTIVITY_FIELD_LABELS: Record<string, string> = {
  title: "Title",
  description: "Description",
  priority: "Priority",
  difficulty: "Difficulty",
  xpValue: "XP Value",
  deckName: "Deck",
  assigneeName: "Assignee",
  boardSlot: "Board Slot",
  tags: "Tags",
  checklist: "Checklist"
};

type AssigneeMetadata = {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  avatarPath?: string;
};

type AssigneeSummary = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
};

const normalizeAssigneeMetadata = (metadata: unknown): AssigneeMetadata => {
  if (!metadata || typeof metadata !== "object") {
    return {};
  }

  return metadata as AssigneeMetadata;
};

const getAvatarPathFromUrl = (avatarUrl: string | undefined) => {
  if (!avatarUrl) {
    return undefined;
  }

  const publicMarker = `/storage/v1/object/public/${env.SUPABASE_AVATAR_BUCKET}/`;
  const signedMarker = `/storage/v1/object/sign/${env.SUPABASE_AVATAR_BUCKET}/`;

  if (avatarUrl.includes(publicMarker)) {
    const raw = avatarUrl.split(publicMarker)[1]?.split("?")[0];
    return raw ? decodeURIComponent(raw) : undefined;
  }

  if (avatarUrl.includes(signedMarker)) {
    const raw = avatarUrl.split(signedMarker)[1]?.split("?")[0];
    return raw ? decodeURIComponent(raw) : undefined;
  }

  return undefined;
};

const getSignedAvatarUrl = async (path: string) => {
  const { data, error } = await supabaseAdmin.storage
    .from(env.SUPABASE_AVATAR_BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 30);

  if (error || !data.signedUrl) {
    return null;
  }

  return data.signedUrl;
};

const resolveAssigneeDisplayName = (email: string | null | undefined, metadata: AssigneeMetadata) => {
  const fromMetadata = metadata.displayName?.trim();

  if (fromMetadata) {
    return fromMetadata;
  }

  const composed = `${metadata.firstName ?? ""} ${metadata.lastName ?? ""}`.trim();

  if (composed) {
    return composed;
  }

  const local = email?.split("@")[0]?.trim();
  return local || "Operator";
};

const resolveAssigneeAvatar = async (metadata: AssigneeMetadata) => {
  const path = metadata.avatarPath ?? getAvatarPathFromUrl(metadata.avatarUrl);

  if (path) {
    return await getSignedAvatarUrl(path);
  }

  return metadata.avatarUrl ?? null;
};

const getAssigneeSummary = async (
  assigneeId: string,
  cache: Map<string, AssigneeSummary | null>
) => {
  if (cache.has(assigneeId)) {
    return cache.get(assigneeId) ?? null;
  }

  const { data, error } = await supabaseAdmin.auth.admin.getUserById(assigneeId);

  if (error || !data.user) {
    cache.set(assigneeId, null);
    return null;
  }

  const metadata = normalizeAssigneeMetadata(data.user.user_metadata);
  const summary: AssigneeSummary = {
    id: data.user.id,
    displayName: resolveAssigneeDisplayName(data.user.email, metadata),
    avatarUrl: await resolveAssigneeAvatar(metadata)
  };

  cache.set(assigneeId, summary);
  return summary;
};

const serializeCardsWithAssignees = async (cards: SFCardWithChecklist[]) => {
  const cache = new Map<string, AssigneeSummary | null>();
  const assigneeIds = [...new Set(cards.map((card) => card.assignee_id).filter(Boolean) as string[])];

  await Promise.all(assigneeIds.map((assigneeId) => getAssigneeSummary(assigneeId, cache)));

  return cards.map((card) => ({
    ...serializeCard(card),
    assignee: card.assignee_id ? cache.get(card.assignee_id) ?? null : null
  }));
};

const serializeCardWithAssignee = async (card: SFCardWithChecklist) => {
  const [serialized] = await serializeCardsWithAssignees([card]);
  return serialized;
};

const ensureDeckForProject = async (deckId: string, projectId: string) => {
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

  await ensureProjectAccess((card as SFCardWithChecklist).project_id, userId);
  const policy = await getProjectMemberPolicy((card as SFCardWithChecklist).project_id, userId);

  if (!canReadDeck(policy, (card as SFCardWithChecklist).deck_id)) {
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

const getDeckName = async (deckId: string) => {
  const { data } = await supabaseAdmin
    .from("sf_decks")
    .select("name")
    .eq("id", deckId)
    .maybeSingle();

  return (data as { name: string } | null)?.name ?? null;
};

const ensureCardClaimIsMutable = (
  card: SFCardWithChecklist,
  userId: string,
  options: { isChangingAssignee?: boolean }
) => {
  if (!card.assignee_id || card.assignee_id === userId) {
    return;
  }

  if (options.isChangingAssignee) {
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

const toCardActivityState = async (card: SFCardWithChecklist) => {
  const serialized = await serializeCardWithAssignee(card);

  if (!serialized) {
    throw new AppError("Card not found", 404);
  }

  return {
    title: serialized.title,
    description: serialized.description,
    priority: serialized.priority,
    difficulty: serialized.difficulty,
    xpValue: serialized.xpValue,
    deckId: serialized.deckId,
    deckName: await getDeckName(serialized.deckId),
    assigneeId: serialized.assigneeId ?? null,
    assigneeName: serialized.assignee?.displayName ?? null,
    boardSlot: serialized.boardSlot ?? null,
    tags: serialized.tags,
    checklist: serialized.checklist.map((item) => ({
      label: item.label,
      completed: item.completed,
      sortOrder: item.sortOrder ?? 0
    }))
  };
};

export const cardService = {
  async listByProject(projectId: string, userId: string) {
    await ensureProjectAccess(projectId, userId);
    const policy = await getProjectMemberPolicy(projectId, userId);

    const { data, error } = await supabaseAdmin
      .from("sf_cards")
      .select(CARD_SELECT)
      .eq("project_id", projectId)
      .order("updated_at", { ascending: false });

    if (error) {
      throw new AppError(error.message, 500);
    }

    const filtered = (data as SFCardWithChecklist[]).filter((card) => canReadDeck(policy, card.deck_id));

    return serializeCardsWithAssignees(filtered);
  },

  async create(userId: string, payload: unknown) {
    const input = createCardSchema.parse(payload);
    await ensureProjectAccess(input.projectId, userId);
    const policy = await getProjectMemberPolicy(input.projectId, userId);

    if (!canWriteDeck(policy, input.deckId)) {
      throw new AppError("You do not have permission to create cards in this deck", 403);
    }

    const assigneeId = await ensureAssignee(input.assigneeId);
    const deck = await ensureDeckForProject(input.deckId, input.projectId);
    ensureDeckCanAssign(deck, Boolean(assigneeId));

    const { data: card, error } = await supabaseAdmin
      .from("sf_cards")
      .insert({
        title: input.title,
        description: input.description || null,
        priority: toCardPriority(input.priority),
        difficulty: toCardDifficulty(input.difficulty),
        xp_value: difficultyToXp(input.difficulty),
        assignee_id: assigneeId,
        board_slot: assigneeId ? (input.boardSlot ?? null) : null,
        project_id: input.projectId,
        deck_id: deck.id,
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

    const createdCard = await fetchCardById(card.id);
    const afterState = await toCardActivityState(createdCard);

    await activityService.log({
      projectId: createdCard.project_id,
      actorUserId: userId,
      action: "created",
      entityType: "card",
      entityId: createdCard.id,
      entityLabel: createdCard.title,
      summary: `Created card \"${createdCard.title}\"`,
      afterState,
      metadata: {
        deckId: createdCard.deck_id,
        deckName: afterState.deckName
      }
    });

    return serializeCardWithAssignee(createdCard);
  },

  async update(cardId: string, userId: string, payload: unknown) {
    const input = updateCardSchema.parse(payload);
    const existingCard = await fetchCardForUser(cardId, userId);
    const beforeState = await toCardActivityState(existingCard);
    const policy = await getProjectMemberPolicy(existingCard.project_id, userId);

    if (!canWriteDeck(policy, existingCard.deck_id)) {
      throw new AppError("You do not have permission to edit cards in this deck", 403);
    }

    if (input.deckId && !canWriteDeck(policy, input.deckId)) {
      throw new AppError("You do not have permission to move cards to that deck", 403);
    }

    ensureCardClaimIsMutable(existingCard, userId, { isChangingAssignee: input.assigneeId !== undefined });

    const updateFields: Record<string, unknown> = {};
    if (input.title !== undefined) updateFields["title"] = input.title;
    if (input.description !== undefined) updateFields["description"] = input.description || null;
    if (input.priority !== undefined) updateFields["priority"] = toCardPriority(input.priority);
    if (input.difficulty !== undefined) {
      updateFields["difficulty"] = toCardDifficulty(input.difficulty);
      updateFields["xp_value"] = difficultyToXp(input.difficulty);
    }
    if (input.tags !== undefined) updateFields["tags"] = input.tags;
    const nextAssigneeId =
      input.assigneeId !== undefined ? await ensureAssignee(input.assigneeId) : existingCard.assignee_id;

    if (input.assigneeId !== undefined) {
      updateFields["assignee_id"] = nextAssigneeId;

      if (!nextAssigneeId) {
        updateFields["board_slot"] = null;
      }
    }

    if (input.boardSlot !== undefined) {
      updateFields["board_slot"] = nextAssigneeId ? input.boardSlot : null;
    }

    let nextDeck = await ensureDeckForProject(existingCard.deck_id, existingCard.project_id);

    if (input.deckId !== undefined) {
      nextDeck = await ensureDeckForProject(input.deckId, existingCard.project_id);
      updateFields["deck_id"] = nextDeck.id;
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

    const updatedCard = await fetchCardById(cardId);
    const afterState = await toCardActivityState(updatedCard);
    const changes = buildActivityChanges(beforeState, afterState, CARD_ACTIVITY_FIELD_LABELS);

    if (changes.length > 0) {
      await activityService.log({
        projectId: updatedCard.project_id,
        actorUserId: userId,
        action: "updated",
        entityType: "card",
        entityId: updatedCard.id,
        entityLabel: updatedCard.title,
        summary:
          beforeState.title !== afterState.title
            ? `Renamed card \"${String(beforeState.title)}\" to \"${updatedCard.title}\"`
            : `Updated card \"${updatedCard.title}\"`,
        beforeState,
        afterState,
        changes,
        metadata: {
          changeCount: changes.length
        }
      });
    }

    return serializeCardWithAssignee(updatedCard);
  },

  async assign(cardId: string, userId: string, payload: unknown) {
    const input = assignCardSchema.parse(payload);
    const existingCard = await fetchCardForUser(cardId, userId);
    const beforeState = await toCardActivityState(existingCard);
    const policy = await getProjectMemberPolicy(existingCard.project_id, userId);

    if (!canWriteDeck(policy, existingCard.deck_id)) {
      throw new AppError("You do not have permission to claim cards in this deck", 403);
    }

    ensureCardClaimIsMutable(existingCard, userId, { isChangingAssignee: true });

    const deck = await ensureDeckForProject(existingCard.deck_id, existingCard.project_id);
    const nextAssigneeId = await ensureAssignee(input.assigneeId);

    ensureDeckCanAssign(deck, Boolean(nextAssigneeId));

    const { error } = await supabaseAdmin
      .from("sf_cards")
      .update({ assignee_id: nextAssigneeId })
      .eq("id", cardId);

    if (error) {
      throw new AppError(error.message, 500);
    }

    const updatedCard = await fetchCardById(cardId);
    const afterState = await toCardActivityState(updatedCard);
    const changes = buildActivityChanges(beforeState, afterState, CARD_ACTIVITY_FIELD_LABELS);

    await activityService.log({
      projectId: updatedCard.project_id,
      actorUserId: userId,
      action: "assigned",
      entityType: "card",
      entityId: updatedCard.id,
      entityLabel: updatedCard.title,
      summary: afterState.assigneeName
        ? `Assigned card \"${updatedCard.title}\" to ${String(afterState.assigneeName)}`
        : `Unassigned card \"${updatedCard.title}\"`,
      beforeState,
      afterState,
      changes,
      metadata: {
        assigneeId: afterState.assigneeId,
        assigneeName: afterState.assigneeName
      }
    });

    return serializeCardWithAssignee(updatedCard);
  },

  async remove(cardId: string, userId: string) {
    const card = await fetchCardForUser(cardId, userId);
    const beforeState = await toCardActivityState(card);
    const policy = await getProjectMemberPolicy(card.project_id, userId);

    if (!canWriteDeck(policy, card.deck_id)) {
      throw new AppError("You do not have permission to delete cards in this deck", 403);
    }

    const { error } = await supabaseAdmin
      .from("sf_cards")
      .delete()
      .eq("id", cardId);

    if (error) {
      throw new AppError(error.message, 500);
    }

    await activityService.log({
      projectId: card.project_id,
      actorUserId: userId,
      action: "deleted",
      entityType: "card",
      entityId: card.id,
      entityLabel: card.title,
      summary: `Deleted card \"${card.title}\"`,
      beforeState,
      metadata: {
        deckId: card.deck_id,
        deckName: beforeState.deckName
      }
    });
  }
};
