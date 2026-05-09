import { supabaseAdmin } from "../config/db.js";
import { AppError } from "../middleware/errorHandler.js";
import type { SFDeckRow } from "../models/deckModel.js";
import { activityService, buildActivityChanges } from "./activityService.js";
import { serializeDeck } from "../utils/cardTransforms.js";
import { canCreateDeck, canReadDeck, canWriteDeck, getProjectMemberPolicy } from "../utils/memberPermissions.js";
import { ensureProjectAccess } from "../utils/projectAccess.js";
import { createDeckSchema, updateDeckSchema } from "../utils/validators.js";

const RESERVED_DECK_SLUGS = new Set(["debug", "completed"]);

const DECK_ACTIVITY_FIELD_LABELS: Record<string, string> = {
  name: "Name",
  description: "Description",
  icon: "Icon",
  color: "Color",
  isAccessible: "Visible",
  allowAssignment: "Assignable",
  xpPayout: "XP Payout",
  completionTargetDeckName: "Completion Target"
};

const toSlug = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const fetchDeckForUser = async (deckId: string, userId: string) => {
  const { data: deck } = await supabaseAdmin
    .from("sf_decks")
    .select("*")
    .eq("id", deckId)
    .single();

  if (!deck) {
    throw new AppError("Deck not found", 404);
  }

  await ensureProjectAccess((deck as SFDeckRow).project_id, userId);
  return deck as SFDeckRow;
};

const resolveCompletionTargetDeckId = async (projectId: string, requestedDeckId?: string) => {
  if (requestedDeckId) {
    const { data } = await supabaseAdmin
      .from("sf_decks")
      .select("id")
      .eq("id", requestedDeckId)
      .eq("project_id", projectId)
      .single();

    if (!data) {
      throw new AppError("Completion target deck not found in this project", 400);
    }

    return requestedDeckId;
  }

  const { data: completedDeck } = await supabaseAdmin
    .from("sf_decks")
    .select("id")
    .eq("project_id", projectId)
    .eq("system_key", "COMPLETED")
    .maybeSingle();

  if (!completedDeck) {
    throw new AppError("Completed deck not found for this project", 400);
  }

  return completedDeck.id as string;
};

const getDeckName = async (deckId: string | null | undefined) => {
  if (!deckId) {
    return null;
  }

  const { data } = await supabaseAdmin
    .from("sf_decks")
    .select("name")
    .eq("id", deckId)
    .maybeSingle();

  return (data as { name: string } | null)?.name ?? null;
};

const toDeckActivityState = async (deck: SFDeckRow) => ({
  name: deck.name,
  description: deck.description,
  icon: deck.icon,
  color: deck.color,
  isAccessible: deck.is_accessible,
  allowAssignment: deck.allow_assignment,
  xpPayout: deck.xp_payout,
  completionTargetDeckId: deck.completion_target_deck_id,
  completionTargetDeckName: await getDeckName(deck.completion_target_deck_id),
  slug: deck.slug,
  isSystem: deck.is_system
});

export const deckService = {
  async listByProject(projectId: string, userId: string) {
    await ensureProjectAccess(projectId, userId);
    const policy = await getProjectMemberPolicy(projectId, userId);

    const { data, error } = await supabaseAdmin
      .from("sf_decks")
      .select("*")
      .eq("project_id", projectId)
      .order("is_system", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      throw new AppError(error.message, 500);
    }

    return (data as SFDeckRow[])
      .filter((deck) => canReadDeck(policy, deck.id))
      .map(serializeDeck);
  },

  async create(userId: string, payload: unknown) {
    const input = createDeckSchema.parse(payload);
    await ensureProjectAccess(input.projectId, userId);
    const policy = await getProjectMemberPolicy(input.projectId, userId);

    if (!canCreateDeck(policy)) {
      throw new AppError("You do not have permission to create decks", 403);
    }

    const completionTargetDeckId = await resolveCompletionTargetDeckId(
      input.projectId,
      input.completionTargetDeckId
    );

    const slug = toSlug(input.name);
    if (!slug || RESERVED_DECK_SLUGS.has(slug)) {
      throw new AppError("Deck name is reserved or invalid", 400);
    }

    const { data: existingDeck } = await supabaseAdmin
      .from("sf_decks")
      .select("id")
      .eq("project_id", input.projectId)
      .eq("slug", slug)
      .maybeSingle();

    if (existingDeck) {
      throw new AppError("A deck with this name already exists", 409);
    }

    const { data: maxOrderRow } = await supabaseAdmin
      .from("sf_decks")
      .select("sort_order")
      .eq("project_id", input.projectId)
      .eq("is_system", false)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextSortOrder = (maxOrderRow?.sort_order ?? 0) + 1;

    const { data: deck, error } = await supabaseAdmin
      .from("sf_decks")
      .insert({
        project_id: input.projectId,
        completion_target_deck_id: completionTargetDeckId,
        name: input.name.trim(),
        slug,
        description: input.description?.trim() || null,
        icon: input.icon?.trim() || null,
        color: input.color,
        is_accessible: input.isAccessible,
        allow_assignment: input.allowAssignment,
        xp_payout: input.xpPayout ?? 0,
        is_system: false,
        sort_order: nextSortOrder
      })
      .select("*")
      .single();

    if (error || !deck) {
      throw new AppError(error?.message ?? "Failed to create deck", 500);
    }

    const createdDeck = deck as SFDeckRow;
    const afterState = await toDeckActivityState(createdDeck);

    await activityService.log({
      projectId: createdDeck.project_id,
      actorUserId: userId,
      action: "created",
      entityType: "deck",
      entityId: createdDeck.id,
      entityLabel: createdDeck.name,
      summary: `Created deck \"${createdDeck.name}\"`,
      afterState,
      metadata: {
        isSystem: createdDeck.is_system
      }
    });

    return serializeDeck(createdDeck);
  },

  async update(deckId: string, userId: string, payload: unknown) {
    const input = updateDeckSchema.parse(payload);
    const existingDeck = await fetchDeckForUser(deckId, userId);
    const beforeState = await toDeckActivityState(existingDeck);
    const policy = await getProjectMemberPolicy(existingDeck.project_id, userId);

    if (!canWriteDeck(policy, existingDeck.id)) {
      throw new AppError("You do not have permission to edit this deck", 403);
    }

    const updateFields: Record<string, unknown> = {};

    if (input.name !== undefined) {
      if (existingDeck.is_system) {
        throw new AppError("System deck names cannot be changed", 400);
      }

      const slug = toSlug(input.name);
      if (!slug || RESERVED_DECK_SLUGS.has(slug)) {
        throw new AppError("Deck name is reserved or invalid", 400);
      }

      const { data: conflictingDeck } = await supabaseAdmin
        .from("sf_decks")
        .select("id")
        .eq("project_id", existingDeck.project_id)
        .eq("slug", slug)
        .neq("id", deckId)
        .maybeSingle();

      if (conflictingDeck) {
        throw new AppError("A deck with this name already exists", 409);
      }

      updateFields["name"] = input.name.trim();
      updateFields["slug"] = slug;
    }

    if (input.description !== undefined) {
      updateFields["description"] = input.description?.trim() || null;
    }

    if (input.icon !== undefined) {
      updateFields["icon"] = input.icon?.trim() || null;
    }

    if (input.color !== undefined) {
      updateFields["color"] = input.color;
    }

    if (input.isAccessible !== undefined) {
      updateFields["is_accessible"] = input.isAccessible;
    }

    if (input.allowAssignment !== undefined) {
      updateFields["allow_assignment"] = input.allowAssignment;
    }

    if (input.xpPayout !== undefined) {
      updateFields["xp_payout"] = input.xpPayout;
    }

    if (input.completionTargetDeckId !== undefined) {
      updateFields["completion_target_deck_id"] = await resolveCompletionTargetDeckId(
        existingDeck.project_id,
        input.completionTargetDeckId
      );
    }

    if (
      input.isAccessible === false &&
      (input.allowAssignment === undefined || input.allowAssignment === true)
    ) {
      updateFields["allow_assignment"] = false;
    }

    const { data: deck, error } = await supabaseAdmin
      .from("sf_decks")
      .update(updateFields)
      .eq("id", deckId)
      .select("*")
      .single();

    if (error || !deck) {
      throw new AppError(error?.message ?? "Failed to update deck", 500);
    }

    if ((deck as SFDeckRow).is_accessible === false) {
      const { error: unassignError } = await supabaseAdmin
        .from("sf_cards")
        .update({ assignee_id: null })
        .eq("deck_id", deckId)
        .not("assignee_id", "is", null);

      if (unassignError) {
        throw new AppError(unassignError.message, 500);
      }
    }

    const updatedDeck = deck as SFDeckRow;
    const afterState = await toDeckActivityState(updatedDeck);
    const changes = buildActivityChanges(beforeState, afterState, DECK_ACTIVITY_FIELD_LABELS);

    if (changes.length > 0) {
      await activityService.log({
        projectId: updatedDeck.project_id,
        actorUserId: userId,
        action: "updated",
        entityType: "deck",
        entityId: updatedDeck.id,
        entityLabel: updatedDeck.name,
        summary:
          beforeState.name !== afterState.name
            ? `Renamed deck \"${String(beforeState.name)}\" to \"${updatedDeck.name}\"`
            : `Updated deck \"${updatedDeck.name}\"`,
        beforeState,
        afterState,
        changes,
        metadata: {
          changeCount: changes.length
        }
      });
    }

    return serializeDeck(updatedDeck);
  },

  async remove(deckId: string, userId: string) {
    const existingDeck = await fetchDeckForUser(deckId, userId);
    const beforeState = await toDeckActivityState(existingDeck);
    const policy = await getProjectMemberPolicy(existingDeck.project_id, userId);

    if (!canWriteDeck(policy, existingDeck.id)) {
      throw new AppError("You do not have permission to delete this deck", 403);
    }

    if (existingDeck.is_system) {
      throw new AppError("System decks cannot be deleted", 400);
    }

    const { count, error: countError } = await supabaseAdmin
      .from("sf_cards")
      .select("id", { count: "exact", head: true })
      .eq("deck_id", deckId);

    if (countError) {
      throw new AppError(countError.message, 500);
    }

    if ((count ?? 0) > 0) {
      throw new AppError("Cannot delete deck while cards are assigned to it", 400);
    }

    const { data: referencingDecks, error: referencingError } = await supabaseAdmin
      .from("sf_decks")
      .select("id, name")
      .eq("completion_target_deck_id", deckId)
      .neq("id", deckId);

    if (referencingError) {
      throw new AppError(referencingError.message, 500);
    }

    if ((referencingDecks?.length ?? 0) > 0) {
      const names = (referencingDecks ?? [])
        .map((deck) => String((deck as { name?: string }).name ?? "Unknown"))
        .filter(Boolean)
        .slice(0, 5);

      const suffix = (referencingDecks?.length ?? 0) > 5 ? " and more" : "";
      throw new AppError(
        `Cannot delete deck while it is used as a completion target by: ${names.join(", ")}${suffix}`,
        400
      );
    }

    const { data: deletedDeck, error } = await supabaseAdmin
      .from("sf_decks")
      .delete()
      .eq("id", deckId)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new AppError(error.message, 500);
    }

    if (!deletedDeck) {
      throw new AppError("Deck delete did not apply", 409);
    }

    await activityService.log({
      projectId: existingDeck.project_id,
      actorUserId: userId,
      action: "deleted",
      entityType: "deck",
      entityId: existingDeck.id,
      entityLabel: existingDeck.name,
      summary: `Deleted deck \"${existingDeck.name}\"`,
      beforeState,
      metadata: {
        isSystem: existingDeck.is_system
      }
    });
  }
};
