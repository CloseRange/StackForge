import { supabaseAdmin } from "../config/db.js";
import { AppError } from "../middleware/errorHandler.js";
import type { SFDeckRow } from "../models/deckModel.js";
import { serializeDeck } from "../utils/cardTransforms.js";
import { createDeckSchema, updateDeckSchema } from "../utils/validators.js";

const RESERVED_DECK_SLUGS = new Set(["debug", "completed"]);

const toSlug = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

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

export const deckService = {
  async listByProject(projectId: string, userId: string) {
    await ensureProjectAccess(projectId, userId);

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

    return (data as SFDeckRow[]).map(serializeDeck);
  },

  async create(userId: string, payload: unknown) {
    const input = createDeckSchema.parse(payload);
    await ensureProjectAccess(input.projectId, userId);
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

    return serializeDeck(deck as SFDeckRow);
  },

  async update(deckId: string, userId: string, payload: unknown) {
    const input = updateDeckSchema.parse(payload);
    const existingDeck = await fetchDeckForUser(deckId, userId);

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

    return serializeDeck(deck as SFDeckRow);
  },

  async remove(deckId: string, userId: string) {
    const existingDeck = await fetchDeckForUser(deckId, userId);

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

    const { count: referencingCount, error: referencingError } = await supabaseAdmin
      .from("sf_decks")
      .select("id", { count: "exact", head: true })
      .eq("completion_target_deck_id", deckId)
      .neq("id", deckId);

    if (referencingError) {
      throw new AppError(referencingError.message, 500);
    }

    if ((referencingCount ?? 0) > 0) {
      throw new AppError("Cannot delete deck while it is used as a completion target", 400);
    }

    const { error } = await supabaseAdmin
      .from("sf_decks")
      .delete()
      .eq("id", deckId);

    if (error) {
      throw new AppError(error.message, 500);
    }
  }
};
