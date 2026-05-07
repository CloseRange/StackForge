import { supabaseAdmin } from "../config/db.js";
import { AppError } from "../middleware/errorHandler.js";

export type DeckPermissionMode = "FULL_ACCESS" | "NO_ACCESS" | "WHITELIST" | "BLACKLIST";
export type ProjectRole = "OWNER" | "ADMIN" | "MEMBER";

export type ProjectMemberPolicy = {
  role: ProjectRole;
  isOwner: boolean;
  deckReadMode: DeckPermissionMode;
  deckReadDeckIds: string[];
  deckWriteMode: DeckPermissionMode;
  deckWriteDeckIds: string[];
};

type MemberPermissionRow = {
  role: string;
  deck_read_mode: string;
  deck_read_deck_ids: string[] | null;
  deck_write_mode: string;
  deck_write_deck_ids: string[] | null;
};

const normalizeMode = (value: string | null | undefined): DeckPermissionMode => {
  if (value === "NO_ACCESS" || value === "WHITELIST" || value === "BLACKLIST") {
    return value;
  }

  return "FULL_ACCESS";
};

const normalizeDeckIds = (value: string[] | null | undefined) => {
  return Array.isArray(value) ? value : [];
};

export const getProjectMemberPolicy = async (
  projectId: string,
  userId: string
): Promise<ProjectMemberPolicy> => {
  const { data: owned } = await supabaseAdmin
    .from("sf_projects")
    .select("id")
    .eq("id", projectId)
    .eq("owner_id", userId)
    .maybeSingle();

  if (owned) {
    return {
      role: "OWNER",
      isOwner: true,
      deckReadMode: "FULL_ACCESS",
      deckReadDeckIds: [],
      deckWriteMode: "FULL_ACCESS",
      deckWriteDeckIds: []
    };
  }

  const { data: member } = await supabaseAdmin
    .from("sf_project_members")
    .select("role, deck_read_mode, deck_read_deck_ids, deck_write_mode, deck_write_deck_ids")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!member) {
    throw new AppError("Project not found", 404);
  }

  const row = member as MemberPermissionRow;

  return {
    role: row.role === "ADMIN" ? "ADMIN" : "MEMBER",
    isOwner: false,
    deckReadMode: normalizeMode(row.deck_read_mode),
    deckReadDeckIds: normalizeDeckIds(row.deck_read_deck_ids),
    deckWriteMode: normalizeMode(row.deck_write_mode),
    deckWriteDeckIds: normalizeDeckIds(row.deck_write_deck_ids)
  };
};

const isDeckAllowed = (mode: DeckPermissionMode, deckIds: string[], deckId: string) => {
  if (mode === "FULL_ACCESS") {
    return true;
  }

  if (mode === "NO_ACCESS") {
    return false;
  }

  if (mode === "WHITELIST") {
    return deckIds.includes(deckId);
  }

  return !deckIds.includes(deckId);
};

export const canReadDeck = (policy: ProjectMemberPolicy, deckId: string) => {
  return isDeckAllowed(policy.deckReadMode, policy.deckReadDeckIds, deckId);
};

export const canWriteDeck = (policy: ProjectMemberPolicy, deckId: string) => {
  return isDeckAllowed(policy.deckWriteMode, policy.deckWriteDeckIds, deckId);
};

export const canCreateDeck = (policy: ProjectMemberPolicy) => {
  if (policy.isOwner) {
    return true;
  }

  // New deck has no id yet: whitelist cannot match a not-yet-created id.
  return policy.deckWriteMode === "FULL_ACCESS" || policy.deckWriteMode === "BLACKLIST";
};
