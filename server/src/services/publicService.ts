import { supabaseAdmin } from "../config/db.js";
import { AppError } from "../middleware/errorHandler.js";
import type { SFCardWithChecklist } from "../models/cardModel.js";
import type { SFDeckRow } from "../models/deckModel.js";
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

    const row = project as SFProjectRow;

    return {
      project: {
        id: row.id,
        name: row.name,
        description: row.description,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      },
      decks: (decks as SFDeckRow[]).map(serializeDeck),
      cards: (cards as SFCardWithChecklist[]).map(serializePublicCard)
    };
  }
};
