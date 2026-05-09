import { supabaseAdmin } from "../config/db.js";
import { AppError } from "../middleware/errorHandler.js";

/**
 * Verifies that `userId` is either the project owner or a project member.
 * Throws 404 if there is no matching project/membership.
 */
export const ensureProjectAccess = async (projectId: string, userId: string) => {
  const { data: owned } = await supabaseAdmin
    .from("sf_projects")
    .select("id")
    .eq("id", projectId)
    .eq("owner_id", userId)
    .maybeSingle();

  if (owned) {
    return;
  }

  const { data: member } = await supabaseAdmin
    .from("sf_project_members")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!member) {
    throw new AppError("Project not found", 404);
  }
};

/**
 * Verifies that `userId` is the project owner.
 * Throws 404 if there is no matching project or the user is not the owner.
 */
export const ensureProjectOwner = async (projectId: string, userId: string) => {
  const { data } = await supabaseAdmin
    .from("sf_projects")
    .select("id")
    .eq("id", projectId)
    .eq("owner_id", userId)
    .maybeSingle();

  if (!data) {
    throw new AppError("Project not found or access denied", 404);
  }
};

/**
 * Verifies that `userId` is the project owner.
 * Admin is a reserved owner-only role.
 */
export const ensureProjectAdmin = async (projectId: string, userId: string) => {
  const { data } = await supabaseAdmin
    .from("sf_projects")
    .select("id")
    .eq("id", projectId)
    .eq("owner_id", userId)
    .maybeSingle();

  if (!data) {
    throw new AppError("Project not found or access denied", 404);
  }
};
