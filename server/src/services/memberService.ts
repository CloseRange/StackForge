import { z } from "zod";

import { supabaseAdmin } from "../config/db.js";
import { AppError } from "../middleware/errorHandler.js";
import { ensureProjectAccess, ensureProjectAdmin, ensureProjectOwner } from "../utils/projectAccess.js";
import { setMemberPermissionsSchema } from "../utils/validators.js";
import { activityService, buildActivityChanges } from "./activityService.js";

type UserMetadata = {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  statusMessage?: string;
  avatarUrl?: string;
  userCode?: string;
};

type MemberRow = {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  role_id: string;
  invited_by: string | null;
  deck_read_mode: string;
  deck_read_deck_ids: string[] | null;
  deck_write_mode: string;
  deck_write_deck_ids: string[] | null;
  created_at: string;
};

type RoleRow = {
  id: string;
  project_id: string;
  name: string;
  is_system: boolean;
  created_at: string;
};

type MemberSummary = {
  id: string;
  role: string;
  roleId: string | null;
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

type ProjectRoleSummary = {
  id: string;
  name: string;
  isSystem: boolean;
  memberCount: number;
};

const addMemberSchema = z.object({
  userCode: z.string().min(1).max(10).transform((v) => v.toUpperCase())
});

const createRoleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .transform((value) => value.replace(/\s+/g, " "))
});

const MEMBER_ACTIVITY_FIELD_LABELS: Record<string, string> = {
  displayName: "Member",
  role: "Role",
  roleId: "Role Id",
  userCode: "User Code",
  deckReadMode: "Read Access Mode",
  deckReadDeckIds: "Readable Decks",
  deckWriteMode: "Write Access Mode",
  deckWriteDeckIds: "Writable Decks"
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

const normalizePermissionMode = (value: string | null | undefined) => {
  if (value === "NO_ACCESS" || value === "WHITELIST" || value === "BLACKLIST") {
    return value;
  }

  return "FULL_ACCESS" as const;
};

const isAdminRoleName = (value: string) => value.trim().toLowerCase() === "admin";

const listProjectRoles = async (projectId: string) => {
  const { data, error } = await supabaseAdmin
    .from("sf_project_roles")
    .select("id, project_id, name, is_system, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new AppError(error.message, 500);
  }

  return (data ?? []) as RoleRow[];
};

const getRoleById = async (projectId: string, roleId: string) => {
  const { data, error } = await supabaseAdmin
    .from("sf_project_roles")
    .select("id, project_id, name, is_system, created_at")
    .eq("project_id", projectId)
    .eq("id", roleId)
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, 500);
  }

  return data as RoleRow | null;
};

const getDefaultUserRole = async (projectId: string) => {
  const { data, error } = await supabaseAdmin
    .from("sf_project_roles")
    .select("id, project_id, name, is_system, created_at")
    .eq("project_id", projectId)
    .ilike("name", "user")
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, 500);
  }

  if (!data) {
    throw new AppError("Project role configuration is invalid. Missing default user role", 500);
  }

  return data as RoleRow;
};

const ensureProjectRolesInitialized = async (projectId: string) => {
  const { data: adminRole, error: adminError } = await supabaseAdmin
    .from("sf_project_roles")
    .select("id")
    .eq("project_id", projectId)
    .ilike("name", "admin")
    .maybeSingle();

  if (adminError) {
    throw new AppError(adminError.message, 500);
  }

  if (!adminRole) {
    const { error } = await supabaseAdmin.from("sf_project_roles").insert({
      project_id: projectId,
      name: "admin",
      is_system: true
    });

    if (error) {
      throw new AppError(error.message, 500);
    }
  }

  const { data: userRole, error: userError } = await supabaseAdmin
    .from("sf_project_roles")
    .select("id")
    .eq("project_id", projectId)
    .ilike("name", "user")
    .maybeSingle();

  if (userError) {
    throw new AppError(userError.message, 500);
  }

  if (!userRole) {
    const { error } = await supabaseAdmin.from("sf_project_roles").insert({
      project_id: projectId,
      name: "user",
      is_system: true
    });

    if (error) {
      throw new AppError(error.message, 500);
    }
  }
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
    roleId?: string | null;
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
    roleId: permissions?.roleId ?? null,
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

const enrichMember = async (member: MemberRow, roleMap: Map<string, RoleRow>) => {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(member.user_id);

  if (error || !data.user) {
    return null;
  }

  const role = roleMap.get(member.role_id);

  return toMemberSummary(data.user, role?.name ?? member.role ?? "user", member.created_at, {
    roleId: member.role_id,
    deckReadMode: member.deck_read_mode,
    deckReadDeckIds: member.deck_read_deck_ids,
    deckWriteMode: member.deck_write_mode,
    deckWriteDeckIds: member.deck_write_deck_ids
  });
};

const toMemberActivityState = (member: MemberSummary) => ({
  displayName: member.displayName,
  role: member.role,
  roleId: member.roleId,
  userCode: member.userCode,
  deckReadMode: member.deckReadMode,
  deckReadDeckIds: member.deckReadDeckIds,
  deckWriteMode: member.deckWriteMode,
  deckWriteDeckIds: member.deckWriteDeckIds
});

const toRoleSummary = (role: RoleRow, memberCount: number): ProjectRoleSummary => ({
  id: role.id,
  name: role.name,
  isSystem: role.is_system,
  memberCount
});

export const memberService = {
  async list(projectId: string, requesterId: string) {
    await ensureProjectAccess(projectId, requesterId);
    await ensureProjectRolesInitialized(projectId);

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

    const roleRows = await listProjectRoles(projectId);
    const roleMap = new Map(roleRows.map((role) => [role.id, role]));
    const memberCountByRoleId = new Map<string, number>();

    for (const row of rows as MemberRow[]) {
      memberCountByRoleId.set(row.role_id, (memberCountByRoleId.get(row.role_id) ?? 0) + 1);
    }

    const roles = roleRows.map((role) => toRoleSummary(role, memberCountByRoleId.get(role.id) ?? 0));

    const members = await Promise.all((rows as MemberRow[]).map((row) => enrichMember(row, roleMap)));
    const filtered = members.filter(Boolean);

    const ownerId = (project as { owner_id: string } | null)?.owner_id ?? null;
    let owner: MemberSummary | null = null;

    if (ownerId) {
      const { data: ownerAuth, error: ownerError } = await supabaseAdmin.auth.admin.getUserById(ownerId);

      if (!ownerError && ownerAuth.user) {
        const adminRole = roleRows.find((role) => isAdminRoleName(role.name));
        owner = toMemberSummary(ownerAuth.user, adminRole?.name ?? "admin", undefined, {
          roleId: adminRole?.id ?? null
        });
      }
    }

    return {
      ownerId,
      owner,
      members: filtered,
      roles
    };
  },

  async listRoles(projectId: string, requesterId: string) {
    await ensureProjectAccess(projectId, requesterId);
    await ensureProjectRolesInitialized(projectId);

    const roleRows = await listProjectRoles(projectId);

    const { data: memberRows, error } = await supabaseAdmin
      .from("sf_project_members")
      .select("role_id")
      .eq("project_id", projectId);

    if (error) {
      throw new AppError(error.message, 500);
    }

    const memberCountByRoleId = new Map<string, number>();

    for (const row of (memberRows ?? []) as Array<{ role_id: string }>) {
      memberCountByRoleId.set(row.role_id, (memberCountByRoleId.get(row.role_id) ?? 0) + 1);
    }

    return roleRows.map((role) => toRoleSummary(role, memberCountByRoleId.get(role.id) ?? 0));
  },

  async createRole(projectId: string, actorUserId: string, payload: unknown) {
    await ensureProjectOwner(projectId, actorUserId);

    const { name } = createRoleSchema.parse(payload);

    if (isAdminRoleName(name)) {
      throw new AppError("Admin role is reserved and cannot be created or renamed", 400);
    }

    const { data, error } = await supabaseAdmin
      .from("sf_project_roles")
      .insert({
        project_id: projectId,
        name,
        is_system: false
      })
      .select("id, project_id, name, is_system, created_at")
      .single();

    if (error || !data) {
      if ((error?.message ?? "").toLowerCase().includes("duplicate")) {
        throw new AppError("A role with this name already exists", 409);
      }

      throw new AppError(error?.message ?? "Failed to create role", 500);
    }

    return toRoleSummary(data as RoleRow, 0);
  },

  async removeRole(projectId: string, actorUserId: string, roleId: string) {
    await ensureProjectOwner(projectId, actorUserId);

    const role = await getRoleById(projectId, roleId);

    if (!role) {
      throw new AppError("Role not found", 404);
    }

    if (isAdminRoleName(role.name)) {
      throw new AppError("Admin role cannot be deleted", 400);
    }

    const { count: totalRolesCount, error: countRolesError } = await supabaseAdmin
      .from("sf_project_roles")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId);

    if (countRolesError) {
      throw new AppError(countRolesError.message, 500);
    }

    if ((totalRolesCount ?? 0) <= 2) {
      throw new AppError("At least two roles are required (including admin)", 400);
    }

    const { count: assignedCount, error: assignedCountError } = await supabaseAdmin
      .from("sf_project_members")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("role_id", roleId);

    if (assignedCountError) {
      throw new AppError(assignedCountError.message, 500);
    }

    if ((assignedCount ?? 0) > 0) {
      throw new AppError("Role is still assigned to one or more members", 400);
    }

    const { error } = await supabaseAdmin
      .from("sf_project_roles")
      .delete()
      .eq("project_id", projectId)
      .eq("id", roleId);

    if (error) {
      throw new AppError(error.message, 500);
    }
  },

  async add(projectId: string, actorUserId: string, payload: unknown) {
    await ensureProjectAdmin(projectId, actorUserId);
    await ensureProjectRolesInitialized(projectId);

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

    const { data: existingMember } = await supabaseAdmin
      .from("sf_project_members")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", targetUser.id)
      .maybeSingle();

    if (existingMember) {
      throw new AppError("This user is already a member of the project", 409);
    }

    const defaultRole = await getDefaultUserRole(projectId);

    const { error } = await supabaseAdmin.from("sf_project_members").insert({
      project_id: projectId,
      user_id: targetUser.id,
      role: defaultRole.name,
      role_id: defaultRole.id,
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

    const roleRows = await listProjectRoles(projectId);
    const roleMap = new Map(roleRows.map((role) => [role.id, role]));
    const member = await enrichMember(insertedRow as MemberRow, roleMap);

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
    await ensureProjectRolesInitialized(projectId);

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

    const { data: targetMember } = await supabaseAdmin
      .from("sf_project_members")
      .select("*")
      .eq("project_id", projectId)
      .eq("user_id", targetUserId)
      .maybeSingle();

    if (!targetMember) {
      throw new AppError("Member not found", 404);
    }

    const roleRows = await listProjectRoles(projectId);
    const roleMap = new Map(roleRows.map((role) => [role.id, role]));
    const targetMemberSummary = await enrichMember(targetMember as MemberRow, roleMap);

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

  async updatePermissions(projectId: string, actorUserId: string, targetUserId: string, payload: unknown) {
    await ensureProjectAdmin(projectId, actorUserId);
    await ensureProjectRolesInitialized(projectId);

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

    const { data: targetMember } = await supabaseAdmin
      .from("sf_project_members")
      .select("*")
      .eq("project_id", projectId)
      .eq("user_id", targetUserId)
      .maybeSingle();

    if (!targetMember) {
      throw new AppError("Member not found", 404);
    }

    const roleRows = await listProjectRoles(projectId);
    const roleMap = new Map(roleRows.map((role) => [role.id, role]));
    const beforeMember = await enrichMember(targetMember as MemberRow, roleMap);

    const nextRole = roleMap.get(input.roleId);

    if (!nextRole) {
      throw new AppError("Selected role does not belong to this project", 400);
    }

    if (isAdminRoleName(nextRole.name)) {
      throw new AppError("Admin role is reserved for the project owner", 400);
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
        role: nextRole.name,
        role_id: nextRole.id,
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

    const member = await enrichMember(updatedMember as MemberRow, roleMap);

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
