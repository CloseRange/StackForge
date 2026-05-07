import { supabaseAdmin } from "../config/db.js";
import { AppError } from "../middleware/errorHandler.js";
import { ensureProjectAccess, ensureProjectOwner } from "../utils/projectAccess.js";
import { z } from "zod";

type UserMetadata = {
  displayName?: string;
  firstName?: string;
  lastName?: string;
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

type MemberRow = {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  invited_by: string | null;
  created_at: string;
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

const enrichMember = async (member: MemberRow) => {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(member.user_id);

  if (error || !data.user) {
    return null;
  }

  const meta = normalizeMetadata(data.user.user_metadata);

  return {
    id: member.user_id,
    role: member.role,
    joinedAt: member.created_at,
    displayName: resolveDisplayName(data.user.email, meta),
    userCode: meta.userCode ?? null,
    avatarUrl: meta.avatarUrl ?? null
  };
};

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

    return {
      ownerId: (project as { owner_id: string } | null)?.owner_id ?? null,
      members: filtered
    };
  },

  async add(projectId: string, ownerId: string, payload: unknown) {
    await ensureProjectOwner(projectId, ownerId);

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
      invited_by: ownerId
    });

    if (error) {
      throw new AppError(error.message, 500);
    }

    const meta = normalizeMetadata(targetUser.user_metadata);

    return {
      id: targetUser.id,
      role: "MEMBER",
      displayName: resolveDisplayName(targetUser.email, meta),
      userCode: meta.userCode ?? null,
      avatarUrl: meta.avatarUrl ?? null
    };
  },

  async remove(projectId: string, ownerId: string, targetUserId: string) {
    await ensureProjectOwner(projectId, ownerId);

    const { error } = await supabaseAdmin
      .from("sf_project_members")
      .delete()
      .eq("project_id", projectId)
      .eq("user_id", targetUserId);

    if (error) {
      throw new AppError(error.message, 500);
    }
  }
};
