import { supabaseAdmin } from "../config/db.js";
import { env } from "../config/env.js";
import { AppError } from "../middleware/errorHandler.js";
import type { SFCardWithChecklist } from "../models/cardModel.js";
import { activityService, buildActivityChanges } from "./activityService.js";
import { notificationService } from "./notificationService.js";
import {
  difficultyToXp,
  serializeCard,
  toCardDifficulty,
  toCardPriority
} from "../utils/cardTransforms.js";
import { canReadDeck, canWriteDeck, getProjectMemberPolicy } from "../utils/memberPermissions.js";
import { ensureProjectAccess } from "../utils/projectAccess.js";
import { getUserAlias, resolveUserDisplayName } from "../utils/userDisplay.js";
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
  checklist: "Checklist",
  dependencies: "Dependencies"
};

type CardDependencyInput = {
  dependsOnCardId: string;
  requiredDeckId: string | null;
};

type CardDependencyView = {
  dependsOnCardId: string;
  requiredDeckId: string | null;
  dependsOnCardTitle: string;
  requiredDeckName: string;
  isSatisfied: boolean;
};

type CardDependencyState = {
  dependencies: CardDependencyView[];
  isActive: boolean;
  blockedBy: string[];
};

const defaultDependencyState = (): CardDependencyState => ({
  dependencies: [],
  isActive: true,
  blockedBy: []
});

const isMissingCardDependenciesTableError = (message: string | null | undefined) =>
  (message ?? "").includes("sf_card_dependencies");

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
  const aliasName = await getUserAlias(assigneeId);
  const summary: AssigneeSummary = {
    id: data.user.id,
    displayName: resolveUserDisplayName(data.user.email, metadata, aliasName),
    avatarUrl: await resolveAssigneeAvatar(metadata)
  };

  cache.set(assigneeId, summary);
  return summary;
};

const serializeCardsWithAssignees = async (cards: SFCardWithChecklist[]) => {
  if (cards.length === 0) {
    return [];
  }

  const cache = new Map<string, AssigneeSummary | null>();
  const assigneeIds = [...new Set(cards.map((card) => card.assignee_id).filter(Boolean) as string[])];
  const projectId = cards[0]?.project_id;

  if (!projectId) {
    return [];
  }

  await Promise.all(assigneeIds.map((assigneeId) => getAssigneeSummary(assigneeId, cache)));
  const dependencyState = await evaluateCardDependencyState(
    projectId,
    cards.map((card) => card.id)
  );

  return cards.map((card) => {
    const state = dependencyState.get(card.id) ?? defaultDependencyState();

    return {
      ...serializeCard(card),
      assignee: card.assignee_id ? cache.get(card.assignee_id) ?? null : null,
      dependencies: state.dependencies,
      isActive: state.isActive,
      blockedBy: state.blockedBy
    };
  });
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

const getProjectBoardSlotLimit = async (projectId: string) => {
  const { data, error } = await supabaseAdmin
    .from("sf_projects")
    .select("max_cards_on_board")
    .eq("id", projectId)
    .maybeSingle();

  if (error) {
    // Pre-migration fallback keeps existing 5-slot behavior.
    if (error.message.includes("max_cards_on_board")) {
      return 5;
    }

    throw new AppError(error.message, 500);
  }

  const raw = (data as { max_cards_on_board?: number } | null)?.max_cards_on_board;

  if (typeof raw !== "number" || !Number.isInteger(raw)) {
    return 5;
  }

  return Math.min(10, Math.max(1, raw));
};

const normalizeDependencyInputs = (
  items: Array<{ dependsOnCardId: string; requiredDeckId?: string | null }>
) => {
  const seen = new Set<string>();
  const normalized: CardDependencyInput[] = [];

  for (const item of items) {
    const key = item.dependsOnCardId;

    if (seen.has(key)) {
      throw new AppError("Each prerequisite card can only be added once", 400);
    }

    seen.add(key);
    normalized.push({
      dependsOnCardId: item.dependsOnCardId,
      requiredDeckId: item.requiredDeckId ?? null
    });
  }

  return normalized;
};

const validateDependencyTargets = async (
  projectId: string,
  dependencies: CardDependencyInput[],
  sourceCardId?: string
) => {
  if (dependencies.length === 0) {
    return;
  }

  const dependencyIds = dependencies.map((item) => item.dependsOnCardId);
  const requiredDeckIds = dependencies
    .map((item) => item.requiredDeckId)
    .filter((value): value is string => Boolean(value));

  if (sourceCardId && dependencyIds.includes(sourceCardId)) {
    throw new AppError("A card cannot depend on itself", 400);
  }

  const { data: cards, error: cardsError } = await supabaseAdmin
    .from("sf_cards")
    .select("id")
    .eq("project_id", projectId)
    .in("id", dependencyIds);

  const { data: decks, error: decksError } =
    requiredDeckIds.length > 0
      ? await supabaseAdmin
          .from("sf_decks")
          .select("id")
          .eq("project_id", projectId)
          .in("id", requiredDeckIds)
      : { data: [], error: null };

  if (cardsError) {
    throw new AppError(cardsError.message, 500);
  }

  if (decksError) {
    throw new AppError(decksError.message, 500);
  }

  const validCardIds = new Set(((cards ?? []) as Array<{ id: string }>).map((row) => row.id));
  const validDeckIds = new Set(((decks ?? []) as Array<{ id: string }>).map((row) => row.id));

  for (const dependencyId of dependencyIds) {
    if (!validCardIds.has(dependencyId)) {
      throw new AppError("Dependency card must belong to the same project", 400);
    }
  }

  for (const deckId of requiredDeckIds) {
    if (!validDeckIds.has(deckId)) {
      throw new AppError("Dependency deck must belong to the same project", 400);
    }
  }
};

const listStoredDependenciesBySource = async (sourceCardId: string) => {
  const { data, error } = await supabaseAdmin
    .from("sf_card_dependencies")
    .select("source_card_id, depends_on_card_id, required_deck_id")
    .eq("source_card_id", sourceCardId);

  if (error) {
    if (isMissingCardDependenciesTableError(error.message)) {
      return [] as CardDependencyInput[];
    }

    throw new AppError(error.message, 500);
  }

  return ((data ?? []) as Array<{
    source_card_id: string;
    depends_on_card_id: string;
    required_deck_id: string | null;
  }>).map((row) => ({
    dependsOnCardId: row.depends_on_card_id,
    requiredDeckId: row.required_deck_id
  }));
};

const replaceDependencies = async (sourceCardId: string, dependencies: CardDependencyInput[]) => {
  try {
    await supabaseAdmin.from("sf_card_dependencies").delete().eq("source_card_id", sourceCardId);

    if (dependencies.length > 0) {
      const { error } = await supabaseAdmin.from("sf_card_dependencies").insert(
        dependencies.map((item) => ({
          source_card_id: sourceCardId,
          depends_on_card_id: item.dependsOnCardId,
          required_deck_id: item.requiredDeckId
        }))
      );

      if (error) {
        throw error;
      }
    }
  } catch (error) {
    if (error instanceof Error && isMissingCardDependenciesTableError(error.message)) {
      throw new AppError("Card dependencies are not available until latest migrations are applied", 500);
    }

    throw error;
  }
};

const evaluateCardDependencyState = async (
  projectId: string,
  sourceCardIds: string[],
  sourceOverrides?: Map<string, CardDependencyInput[]>
) => {
  const stateBySource = new Map<string, CardDependencyState>();

  for (const sourceCardId of sourceCardIds) {
    stateBySource.set(sourceCardId, defaultDependencyState());
  }

  if (sourceCardIds.length === 0) {
    return stateBySource;
  }

  let dependencyRows: Array<{
    source_card_id: string;
    depends_on_card_id: string;
    required_deck_id: string | null;
  }> = [];

  const sourceIdsNeedingQuery = sourceCardIds.filter((id) => !sourceOverrides?.has(id));

  if (sourceIdsNeedingQuery.length > 0) {
    const { data, error } = await supabaseAdmin
      .from("sf_card_dependencies")
      .select("source_card_id, depends_on_card_id, required_deck_id")
      .in("source_card_id", sourceIdsNeedingQuery);

    if (error) {
      if (isMissingCardDependenciesTableError(error.message)) {
        return stateBySource;
      }

      throw new AppError(error.message, 500);
    }

    dependencyRows = (data ?? []) as Array<{
      source_card_id: string;
      depends_on_card_id: string;
      required_deck_id: string | null;
    }>;
  }

  if (sourceOverrides) {
    for (const [sourceCardId, dependencies] of sourceOverrides.entries()) {
      for (const dependency of dependencies) {
        dependencyRows.push({
          source_card_id: sourceCardId,
          depends_on_card_id: dependency.dependsOnCardId,
          required_deck_id: dependency.requiredDeckId
        });
      }
    }
  }

  if (dependencyRows.length === 0) {
    return stateBySource;
  }

  const [{ data: projectCards, error: cardsError }, { data: projectDecks, error: decksError }] = await Promise.all([
    supabaseAdmin
      .from("sf_cards")
      .select("id, title, deck_id")
      .eq("project_id", projectId),
    supabaseAdmin
      .from("sf_decks")
      .select("id, name, system_key")
      .eq("project_id", projectId)
  ]);

  if (cardsError) {
    throw new AppError(cardsError.message, 500);
  }

  if (decksError) {
    throw new AppError(decksError.message, 500);
  }

  const cardsById = new Map(
    ((projectCards ?? []) as Array<{ id: string; title: string; deck_id: string }>).map((row) => [row.id, row])
  );
  const decksById = new Map(
    ((projectDecks ?? []) as Array<{ id: string; name: string; system_key: string | null }>).map((row) => [
      row.id,
      row
    ])
  );
  const completedDeck = ((projectDecks ?? []) as Array<{ id: string; name: string; system_key: string | null }>).find(
    (deck) => deck.system_key === "COMPLETED"
  );

  for (const row of dependencyRows) {
    const sourceState = stateBySource.get(row.source_card_id);

    if (!sourceState) {
      continue;
    }

    const prerequisiteCard = cardsById.get(row.depends_on_card_id);
    const requiredDeckId = row.required_deck_id ?? completedDeck?.id ?? null;
    const requiredDeckName =
      (requiredDeckId ? decksById.get(requiredDeckId)?.name : null) ?? completedDeck?.name ?? "completion deck";
    const isSatisfied = Boolean(
      prerequisiteCard && requiredDeckId && prerequisiteCard.deck_id === requiredDeckId
    );

    sourceState.dependencies.push({
      dependsOnCardId: row.depends_on_card_id,
      requiredDeckId,
      dependsOnCardTitle: prerequisiteCard?.title ?? "Unknown card",
      requiredDeckName,
      isSatisfied
    });
  }

  for (const sourceCardId of sourceCardIds) {
    const state = stateBySource.get(sourceCardId);

    if (!state || state.dependencies.length === 0) {
      continue;
    }

    state.isActive = state.dependencies.every((dependency) => dependency.isSatisfied);
    state.blockedBy = state.dependencies
      .filter((dependency) => !dependency.isSatisfied)
      .map((dependency) => `${dependency.dependsOnCardTitle} in ${dependency.requiredDeckName}`);
  }

  return stateBySource;
};

const ensureCardIsActiveForClaim = async (
  projectId: string,
  sourceCardId: string,
  options?: { dependenciesOverride?: CardDependencyInput[] }
) => {
  const overrides = options?.dependenciesOverride
    ? new Map<string, CardDependencyInput[]>([[sourceCardId, options.dependenciesOverride]])
    : undefined;
  const dependencyState = await evaluateCardDependencyState(projectId, [sourceCardId], overrides);
  const state = dependencyState.get(sourceCardId) ?? defaultDependencyState();

  if (!state.isActive) {
    throw new AppError(
      `Card cannot be claimed yet. Blocked by: ${state.blockedBy.join(", ")}`,
      409
    );
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
    dependencies: serialized.dependencies.map((dependency) => ({
      dependsOnCardId: dependency.dependsOnCardId,
      dependsOnCardTitle: dependency.dependsOnCardTitle,
      requiredDeckId: dependency.requiredDeckId,
      requiredDeckName: dependency.requiredDeckName,
      isSatisfied: dependency.isSatisfied
    })),
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
    const normalizedDependencies = normalizeDependencyInputs(input.dependencies);
    await ensureProjectAccess(input.projectId, userId);
    const policy = await getProjectMemberPolicy(input.projectId, userId);

    if (!canWriteDeck(policy, input.deckId)) {
      throw new AppError("You do not have permission to create cards in this deck", 403);
    }

    await validateDependencyTargets(input.projectId, normalizedDependencies);

    const assigneeId = await ensureAssignee(input.assigneeId);

    if (assigneeId) {
      await ensureCardIsActiveForClaim(input.projectId, "__new-card__", {
        dependenciesOverride: normalizedDependencies
      });
    }

    const deck = await ensureDeckForProject(input.deckId, input.projectId);
    ensureDeckCanAssign(deck, Boolean(assigneeId));

    if (assigneeId && input.boardSlot !== undefined && input.boardSlot !== null) {
      const maxCardsOnBoard = await getProjectBoardSlotLimit(input.projectId);

      if (input.boardSlot >= maxCardsOnBoard) {
        throw new AppError(`Board slot must be between 0 and ${maxCardsOnBoard - 1}`, 400);
      }
    }

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

    if (normalizedDependencies.length > 0) {
      await replaceDependencies(card.id, normalizedDependencies);
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

    await notificationService.notifyAssignedCardChanged({
      projectId: createdCard.project_id,
      cardId: createdCard.id,
      cardTitle: createdCard.title,
      assigneeId: createdCard.assignee_id,
      actorUserId: userId,
      message: `A card assigned to you was created: ${createdCard.title}`
    });

    await notificationService.syncMilestoneCompletionForProject(createdCard.project_id, userId);

    return serializeCardWithAssignee(createdCard);
  },

  async update(cardId: string, userId: string, payload: unknown) {
    const input = updateCardSchema.parse(payload);
    const normalizedDependencies =
      input.dependencies !== undefined ? normalizeDependencyInputs(input.dependencies) : undefined;
    const existingCard = await fetchCardForUser(cardId, userId);
    const beforeState = await toCardActivityState(existingCard);
    const policy = await getProjectMemberPolicy(existingCard.project_id, userId);

    if (!canWriteDeck(policy, existingCard.deck_id)) {
      throw new AppError("You do not have permission to edit cards in this deck", 403);
    }

    if (input.deckId && !canWriteDeck(policy, input.deckId)) {
      throw new AppError("You do not have permission to move cards to that deck", 403);
    }

    if (normalizedDependencies !== undefined) {
      await validateDependencyTargets(existingCard.project_id, normalizedDependencies, existingCard.id);
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
      if (input.boardSlot !== null && nextAssigneeId) {
        const maxCardsOnBoard = await getProjectBoardSlotLimit(existingCard.project_id);

        if (input.boardSlot >= maxCardsOnBoard) {
          throw new AppError(`Board slot must be between 0 and ${maxCardsOnBoard - 1}`, 400);
        }
      }

      updateFields["board_slot"] = nextAssigneeId ? input.boardSlot : null;
    }

    let nextDeck = await ensureDeckForProject(existingCard.deck_id, existingCard.project_id);

    if (input.deckId !== undefined) {
      nextDeck = await ensureDeckForProject(input.deckId, existingCard.project_id);
      updateFields["deck_id"] = nextDeck.id;
    }

    ensureDeckCanAssign(nextDeck, Boolean(nextAssigneeId));

    if (nextAssigneeId) {
      const dependencySource =
        normalizedDependencies !== undefined
          ? normalizedDependencies
          : await listStoredDependenciesBySource(existingCard.id);

      await ensureCardIsActiveForClaim(existingCard.project_id, existingCard.id, {
        dependenciesOverride: dependencySource
      });
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

    if (normalizedDependencies !== undefined) {
      await replaceDependencies(cardId, normalizedDependencies);
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

      await notificationService.notifyAssignedCardChanged({
        projectId: updatedCard.project_id,
        cardId: updatedCard.id,
        cardTitle: updatedCard.title,
        assigneeId: afterState.assigneeId,
        actorUserId: userId,
        message: `A card assigned to you changed: ${updatedCard.title}`
      });
    }

    await notificationService.syncMilestoneCompletionForProject(updatedCard.project_id, userId);

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

    if (nextAssigneeId) {
      await ensureCardIsActiveForClaim(existingCard.project_id, existingCard.id);
    }

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

    await notificationService.notifyAssignedCardChanged({
      projectId: updatedCard.project_id,
      cardId: updatedCard.id,
      cardTitle: updatedCard.title,
      assigneeId: afterState.assigneeId,
      actorUserId: userId,
      message: afterState.assigneeName
        ? `Assignment changed for card: ${updatedCard.title}`
        : `You are no longer assigned to card: ${updatedCard.title}`
    });

    await notificationService.syncMilestoneCompletionForProject(updatedCard.project_id, userId);

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

    await notificationService.syncMilestoneCompletionForProject(card.project_id, userId);
  }
};
