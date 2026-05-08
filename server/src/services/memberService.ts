import { supabaseAdmin } from "../config/db.js";
import { AppError } from "../middleware/errorHandler.js";
import { activityService, buildActivityChanges } from "./activityService.js";
import { ensureProjectAccess, ensureProjectAdmin } from "../utils/projectAccess.js";
import { setMemberPermissionsSchema } from "../utils/validators.js";
import { z } from "zod";

type UserMetadata = {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  statusMessage?: string;
  avatarUrl?: string;
  avatarPath?: string;
  userCode?: string;
};

const normalizeMetadata = (meta: unknown): UserMetadata => {
  if (!meta || typeof meta !== "object") return {};
  return meta as UserMetadata;
};

const resolveDisplayName = (email: string | null | undefined, meta: UserMetadata) => {
  const fromMeta = meta.displayName?.trim() || `${meta.firstName ?? ""} ${meta.lastName ?? ""}`.trim();
  if (fromMeta) return fromMeta;
  return email?.split("@")[0]?.trim() || "Operator";
};

const addMemberSchema = z.object({
  userCode: z.string().min(1).max(10).transform((v) => v.toUpperCase())
});

const MEMBER_ACTIVITY_FIELD_LABELS: Record<string, string> = {
  displayName: "Member",
  role: "Role",
  userCode: "User Code",
  deckReadMode: "Read Access Mode",
  deckReadDeckIds: "Readable Decks",
  deckWriteMode: "Write Access Mode",
  deckWriteDeckIds: "Writable Decks"
};

type MemberRow = {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  invited_by: string | null;
  deck_read_mode: string;
  deck_read_deck_ids: string[] | null;
  deck_write_mode: string;
  deck_write_deck_ids: string[] | null;
  created_at: string;
};

type MemberSummary = {
  id: string;
  role: string;
  joinedAt?: string;
  displayName: string;
  firstName: string;
  lastName: string;
  statusMessage: string;
  userCode: string | null;
  avatarUrl: string | null;
  deckReadMode: "FULL_ACCESS" | "NO_ACCESS" | "WHITELIST" | "BLACKLIST";
  deckReadDeckIds: string[];
  deckWriteMode: "FULL_ACCESS" | "NO_ACCESS" | "WHITELIST" | "BLACKLIST";
  deckWriteDeckIds: string[];
};

const normalizePermissionMode = (value: string | null | undefined) => {
  if (value === "NO_ACCESS" || value === "WHITELIST" || value === "BLACKLIST") {
    return value;
  }

  return "FULL_ACCESS" as const;
};

const findUserByCode = async (userCode: string) => {
  const normalized = userCode.toUpperCase();

  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });

    if (error) {
      throw new AppError(error.message, 500);
    }

    const users = data.users ?? [];

    for (const user of users) {
      const meta = normalizeMetadata(user.user_metadata);
      if (meta.userCode?.toUpperCase() === normalized) {
        return user;
      }
    }

    if (users.length < perPage) {
      break;
    }

    page += 1;
  }

  return null;
};

const toMemberSummary = (
  user: { id: string; email?: string | null; user_metadata?: unknown },
  role: string,
  joinedAt?: string,
  permissions?: {
    deckReadMode?: string;
    deckReadDeckIds?: string[] | null;
    deckWriteMode?: string;
    deckWriteDeckIds?: string[] | null;
  }
): MemberSummary => {
  const meta = normalizeMetadata(user.user_metadata);

  return {
    id: user.id,
    role,
    joinedAt,
    displayName: resolveDisplayName(user.email, meta),
    firstName: meta.firstName ?? "",
    lastName: meta.lastName ?? "",
    statusMessage: meta.statusMessage ?? "",
    userCode: meta.userCode ?? null,
    avatarUrl: meta.avatarUrl ?? null,
    deckReadMode: normalizePermissionMode(permissions?.deckReadMode),
    deckReadDeckIds: permissions?.deckReadDeckIds ?? [],
    deckWriteMode: normalizePermissionMode(permissions?.deckWriteMode),
    deckWriteDeckIds: permissions?.deckWriteDeckIds ?? []
  };
};

const enrichMember = async (member: MemberRow) => {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(member.user_id);

  if (error || !data.user) {
    return null;
  }

  return toMemberSummary(data.user, member.role, member.created_at, {
    deckReadMode: member.deck_read_mode,
    deckReadDeckIds: member.deck_read_deck_ids,
    deckWriteMode: member.deck_write_mode,
    deckWriteDeckIds: member.deck_write_deck_ids
  });
};

const toMemberActivityState = (member: MemberSummary) => ({
  displayName: member.displayName,
  role: member.role,
  userCode: member.userCode,
  deckReadMode: member.deckReadMode,
  deckReadDeckIds: member.deckReadDeckIds,
  deckWriteMode: member.deckWriteMode,
  deckWriteDeckIds: member.deckWriteDeckIds
});

export const memberService = {
  async list(projectId: string, requesterId: string) {
    await ensureProjectAccess(projectId, requesterId);

    const { data: project } = await supabaseAdmin
      .from("sf_projects")
      .select("owner_id")
      .eq("id", projectId)
      .single();

    const { data: rows, error } = await supabaseAdmin
      .from("sf_project_members")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new AppError(error.message, 500);
    }

    const members = await Promise.all((rows as MemberRow[]).map(enrichMember));
    const filtered = members.filter(Boolean);

    const ownerId = (project as { owner_id: string } | null)?.owner_id ?? null;
    let owner: MemberSummary | null = null;

    if (ownerId) {
      const { data: ownerAuth, error: ownerError } = await supabaseAdmin.auth.admin.getUserById(ownerId);

      if (!ownerError && ownerAuth.user) {
        owner = toMemberSummary(ownerAuth.user, "OWNER");
      }
    }

    return {
      ownerId,
      owner,
      members: filtered
    };
  },

  async add(projectId: string, actorUserId: string, payload: unknown) {
    await ensureProjectAdmin(projectId, actorUserId);

    const { data: project } = await supabaseAdmin
      .from("sf_projects")
      .select("owner_id")
      .eq("id", projectId)
      .single();

    const ownerId = (project as { owner_id: string } | null)?.owner_id;

    if (!ownerId) {
      throw new AppError("Project not found", 404);
    }

    const { userCode } = addMemberSchema.parse(payload);

    const targetUser = await findUserByCode(userCode);

    if (!targetUser) {
      throw new AppError(`No user found with code "${userCode}"`, 404);
    }

    if (targetUser.id === ownerId) {
      throw new AppError("You are already the project owner", 400);
    }

    // Check if already a member
    const { data: existingMember } = await supabaseAdmin
      .from("sf_project_members")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", targetUser.id)
      .maybeSingle();

    if (existingMember) {
      throw new AppError("This user is already a member of the project", 409);
    }

    const { error } = await supabaseAdmin.from("sf_project_members").insert({
      project_id: projectId,
      user_id: targetUser.id,
      role: "MEMBER",
      invited_by: actorUserId
    });

    if (error) {
      throw new AppError(error.message, 500);
    }

    const { data: insertedRow, error: insertedError } = await supabaseAdmin
      .from("sf_project_members")
      .select("*")
      .eq("project_id", projectId)
      .eq("user_id", targetUser.id)
      .single();

    if (insertedError || !insertedRow) {
      throw new AppError(insertedError?.message ?? "Failed to load invited member", 500);
    }

    const member = await enrichMember(insertedRow as MemberRow);

    if (!member) {
      throw new AppError("Failed to load invited member", 500);
    }

    await activityService.log({
      projectId,
      actorUserId,
      action: "member_added",
      entityType: "member",
      entityId: member.id,
      entityLabel: member.displayName,
      summary: `Added ${member.displayName} to the project`,
      afterState: toMemberActivityState(member),
      metadata: {
        invitedBy: actorUserId
      }
    });

    return member;
  },

  async remove(projectId: string, actorUserId: string, targetUserId: string) {
    await ensureProjectAdmin(projectId, actorUserId);

    const { data: project } = await supabaseAdmin
      .from("sf_projects")
      .select("owner_id")
      .eq("id", projectId)
      .single();

    const ownerId = (project as { owner_id: string } | null)?.owner_id;

    if (!ownerId) {
      throw new AppError("Project not found", 404);
    }

    if (targetUserId === ownerId) {
      throw new AppError("Project owner cannot be removed", 400);
    }

    const { data: actorMember } = await supabaseAdmin
      .from("sf_project_members")
      .select("role")
      .eq("project_id", projectId)
      .eq("user_id", actorUserId)
      .maybeSingle();

    const actorIsOwner = ownerId === actorUserId;
    const actorIsAdmin = actorMember?.role === "ADMIN";

    const { data: targetMember } = await supabaseAdmin
      .from("sf_project_members")
      .select("*")
      .eq("project_id", projectId)
      .eq("user_id", targetUserId)
      .maybeSingle();

    if (!targetMember) {
      throw new AppError("Member not found", 404);
    }

    if (!actorIsOwner && actorIsAdmin && targetMember.role === "ADMIN") {
      throw new AppError("Only the owner can remove an admin", 403);
    }

    const targetMemberSummary = await enrichMember(targetMember as MemberRow);

    const { error } = await supabaseAdmin
      .from("sf_project_members")
      .delete()
      .eq("project_id", projectId)
      .eq("user_id", targetUserId);

    if (error) {
      throw new AppError(error.message, 500);
    }

    if (targetMemberSummary) {
      await activityService.log({
        projectId,
        actorUserId,
        action: "member_removed",
        entityType: "member",
        entityId: targetMemberSummary.id,
        entityLabel: targetMemberSummary.displayName,
        summary: `Removed ${targetMemberSummary.displayName} from the project`,
        beforeState: toMemberActivityState(targetMemberSummary)
      });
    }
  },

  async updatePermissions(
    projectId: string,
    actorUserId: string,
    targetUserId: string,
    payload: unknown
  ) {
    await ensureProjectAdmin(projectId, actorUserId);

    const input = setMemberPermissionsSchema.parse(payload);

    const { data: project } = await supabaseAdmin
      .from("sf_projects")
      .select("owner_id")
      .eq("id", projectId)
      .single();

    const ownerId = (project as { owner_id: string } | null)?.owner_id;

    if (!ownerId) {
      throw new AppError("Project not found", 404);
    }

    if (targetUserId === ownerId) {
      throw new AppError("Owner role and permissions are always full access", 400);
    }

    const { data: actorMember } = await supabaseAdmin
      .from("sf_project_members")
      .select("role")
      .eq("project_id", projectId)
      .eq("user_id", actorUserId)
      .maybeSingle();

    const actorIsOwner = ownerId === actorUserId;
    const actorIsAdmin = actorMember?.role === "ADMIN";

    const { data: targetMember } = await supabaseAdmin
      .from("sf_project_members")
      .select("*")
      .eq("project_id", projectId)
      .eq("user_id", targetUserId)
      .maybeSingle();

    if (!targetMember) {
      throw new AppError("Member not found", 404);
    }

    const beforeMember = await enrichMember(targetMember as MemberRow);

    if (!actorIsOwner && actorIsAdmin) {
      if (input.role === "ADMIN" || targetMember.role === "ADMIN") {
        throw new AppError("Only the owner can grant or edit admin permissions", 403);
      }
    }

    const deckIds = [...new Set([...input.deckReadDeckIds, ...input.deckWriteDeckIds])];

    if (deckIds.length > 0) {
      const { data: decks, error: decksError } = await supabaseAdmin
        .from("sf_decks")
        .select("id")
        .eq("project_id", projectId)
        .in("id", deckIds);

      if (decksError) {
        throw new AppError(decksError.message, 500);
      }

      const existing = new Set((decks ?? []).map((deck: { id: string }) => deck.id));
      const missing = deckIds.filter((deckId) => !existing.has(deckId));

      if (missing.length > 0) {
        throw new AppError("One or more selected decks are not in this project", 400);
      }
    }

    if (
      (input.deckReadMode === "WHITELIST" || input.deckReadMode === "BLACKLIST") &&
      input.deckReadDeckIds.length === 0
    ) {
      throw new AppError("Read deck list is required for whitelist or blacklist mode", 400);
    }

    if (
      (input.deckWriteMode === "WHITELIST" || input.deckWriteMode === "BLACKLIST") &&
      input.deckWriteDeckIds.length === 0
    ) {
      throw new AppError("Write deck list is required for whitelist or blacklist mode", 400);
    }

    const { error } = await supabaseAdmin
      .from("sf_project_members")
      .update({
        role: input.role,
        deck_read_mode: input.deckReadMode,
        deck_read_deck_ids: input.deckReadDeckIds,
        deck_write_mode: input.deckWriteMode,
        deck_write_deck_ids: input.deckWriteDeckIds
      })
      .eq("project_id", projectId)
      .eq("user_id", targetUserId);

    if (error) {
      throw new AppError(error.message, 500);
    }

    const { data: updatedMember } = await supabaseAdmin
      .from("sf_project_members")
      .select("*")
      .eq("project_id", projectId)
      .eq("user_id", targetUserId)
      .single();

    const member = await enrichMember(updatedMember as MemberRow);

    if (!member) {
      throw new AppError("Failed to load updated member", 500);
    }

    if (beforeMember) {
      const beforeState = toMemberActivityState(beforeMember);
      const afterState = toMemberActivityState(member);
      const changes = buildActivityChanges(beforeState, afterState, MEMBER_ACTIVITY_FIELD_LABELS);

      if (changes.length > 0) {
        await activityService.log({
          projectId,
          actorUserId,
          action: "permissions_updated",
          entityType: "member",
          entityId: member.id,
          entityLabel: member.displayName,
          summary: `Updated permissions for ${member.displayName}`,
          beforeState,
          afterState,
          changes,
          metadata: {
            changeCount: changes.length
          }
        });
      }
    }

    return member;
  }
};
