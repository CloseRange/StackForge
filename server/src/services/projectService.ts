import { supabaseAdmin } from "../config/db.js";
import { AppError } from "../middleware/errorHandler.js";
import type { SFProjectWithCount } from "../models/projectModel.js";
import { serializeProject } from "../utils/cardTransforms.js";
import { ensureProjectAccess, ensureProjectOwner } from "../utils/projectAccess.js";
import { createProjectSchema, updateProjectSchema } from "../utils/validators.js";

const fetchProject = async (projectId: string, userId: string) => {
  await ensureProjectAccess(projectId, userId);

  const { data, error } = await supabaseAdmin
    .from("sf_projects")
    .select("*, sf_cards(count)")
    .eq("id", projectId)
    .single();

  if (error || !data) {
    throw new AppError("Project not found", 404);
  }

  return data as SFProjectWithCount;
};

export const projectService = {
  async list(userId: string) {
    // Owned projects
    const { data: owned, error: ownedError } = await supabaseAdmin
      .from("sf_projects")
      .select("*, sf_cards(count)")
      .eq("owner_id", userId)
      .order("updated_at", { ascending: false });

    if (ownedError) {
      throw new AppError(ownedError.message, 500);
    }

    // Member projects
    const { data: memberships } = await supabaseAdmin
      .from("sf_project_members")
      .select("project_id")
      .eq("user_id", userId);

    const memberProjectIds = (memberships ?? []).map(
      (m: { project_id: string }) => m.project_id
    );

    if (memberProjectIds.length === 0) {
      return (owned as SFProjectWithCount[]).map(serializeProject);
    }

    const { data: memberProjects, error: memberError } = await supabaseAdmin
      .from("sf_projects")
      .select("*, sf_cards(count)")
      .in("id", memberProjectIds)
      .order("updated_at", { ascending: false });

    if (memberError) {
      throw new AppError(memberError.message, 500);
    }

    // Merge, deduplicate, re-sort
    const all = [...(owned as SFProjectWithCount[]), ...(memberProjects as SFProjectWithCount[])];
    const seen = new Set<string>();
    const deduped = all.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
    deduped.sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );

    return deduped.map(serializeProject);
  },

  async create(userId: string, payload: unknown) {
    const input = createProjectSchema.parse(payload);

    const { data, error } = await supabaseAdmin
      .from("sf_projects")
      .insert({
        name: input.name,
        description: input.description || null,
        owner_id: userId
      })
      .select("*, sf_cards(count)")
      .single();

    if (error || !data) {
      throw new AppError(error?.message ?? "Failed to create project", 500);
    }

    const projectId = (data as SFProjectWithCount).id;

    // Ensure completed deck exists for this project.
    const { data: completedDeck } = await supabaseAdmin
      .from("sf_decks")
      .select("id")
      .eq("project_id", projectId)
      .eq("system_key", "COMPLETED")
      .maybeSingle();

    if (!completedDeck) {
      throw new AppError("Failed to initialize completed deck for project", 500);
    }

    const completedDeckId = completedDeck.id as string;

    const { error: completionTargetError } = await supabaseAdmin
      .from("sf_decks")
      .update({ completion_target_deck_id: completedDeckId })
      .eq("project_id", projectId)
      .is("completion_target_deck_id", null);

    if (completionTargetError) {
      throw new AppError(completionTargetError.message, 500);
    }

    return serializeProject(data as SFProjectWithCount);
  },

  async getById(projectId: string, userId: string) {
    return serializeProject(await fetchProject(projectId, userId));
  },

  async update(projectId: string, userId: string, payload: unknown) {
    const input = updateProjectSchema.parse(payload);
    await ensureProjectOwner(projectId, userId);

    const { data, error } = await supabaseAdmin
      .from("sf_projects")
      .update({
        name: input.name,
        description: input.description === undefined ? undefined : input.description || null
      })
      .eq("id", projectId)
      .select("*, sf_cards(count)")
      .single();

    if (error || !data) {
      throw new AppError(error?.message ?? "Failed to update project", 500);
    }

    return serializeProject(data as SFProjectWithCount);
  },

  async remove(projectId: string, userId: string) {
    await ensureProjectOwner(projectId, userId);

    const { error } = await supabaseAdmin
      .from("sf_projects")
      .delete()
      .eq("id", projectId);

    if (error) {
      throw new AppError(error.message, 500);
    }
  }
};
