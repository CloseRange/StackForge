import { supabaseAdmin } from "../config/db.js";
import { AppError } from "../middleware/errorHandler.js";
import type { SFProjectWithCount } from "../models/projectModel.js";
import { activityService, buildActivityChanges } from "./activityService.js";
import { serializeProject } from "../utils/cardTransforms.js";
import { ensureProjectAccess, ensureProjectOwner } from "../utils/projectAccess.js";
import { createProjectSchema, updateProjectSchema } from "../utils/validators.js";

const toProjectSlug = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const PROJECT_ACTIVITY_FIELD_LABELS: Record<string, string> = {
  name: "Name",
  description: "Description",
  isPublic: "Public Visibility",
  slug: "Slug"
};

const generateProjectSlug = async (name: string, ownerId: string, excludeId?: string) => {
  const base = toProjectSlug(name) || "project";

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;

    let query = supabaseAdmin
      .from("sf_projects")
      .select("id")
      .eq("owner_id", ownerId)
      .eq("slug", candidate);

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data } = await query.maybeSingle();

    if (!data) {
      return candidate;
    }
  }

  throw new AppError("Could not generate a unique project slug", 500);
};

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

const toProjectActivityState = (project: SFProjectWithCount) => ({
  name: project.name,
  description: project.description,
  isPublic: project.is_public ?? false,
  slug: project.slug ?? "",
  cardCount: Number(project.sf_cards?.[0]?.count ?? 0)
});

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
    const slug = await generateProjectSlug(input.name, userId);

    const { data, error } = await supabaseAdmin
      .from("sf_projects")
      .insert({
        name: input.name,
        description: input.description || null,
        slug,
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

    await activityService.log({
      projectId,
      actorUserId: userId,
      action: "created",
      entityType: "project",
      entityId: projectId,
      entityLabel: (data as SFProjectWithCount).name,
      summary: `Created project \"${(data as SFProjectWithCount).name}\"`,
      afterState: toProjectActivityState(data as SFProjectWithCount)
    });

    return serializeProject(data as SFProjectWithCount);
  },

  async getById(projectId: string, userId: string) {
    return serializeProject(await fetchProject(projectId, userId));
  },

  async update(projectId: string, userId: string, payload: unknown) {
    const input = updateProjectSchema.parse(payload);
    await ensureProjectOwner(projectId, userId);
    const existingProject = await fetchProject(projectId, userId);
    const beforeState = toProjectActivityState(existingProject);

    const { data, error } = await supabaseAdmin
      .from("sf_projects")
      .update({
        name: input.name,
        description: input.description === undefined ? undefined : input.description || null,
        is_public: input.isPublic
      })
      .eq("id", projectId)
      .select("*, sf_cards(count)")
      .single();

    if (error || !data) {
      throw new AppError(error?.message ?? "Failed to update project", 500);
    }

    const updatedProject = data as SFProjectWithCount;
    const afterState = toProjectActivityState(updatedProject);
    const changes = buildActivityChanges(beforeState, afterState, PROJECT_ACTIVITY_FIELD_LABELS);

    if (changes.length > 0) {
      await activityService.log({
        projectId,
        actorUserId: userId,
        action: "updated",
        entityType: "project",
        entityId: projectId,
        entityLabel: updatedProject.name,
        summary:
          beforeState.name !== afterState.name
            ? `Renamed project \"${String(beforeState.name)}\" to \"${updatedProject.name}\"`
            : `Updated project \"${updatedProject.name}\"`,
        beforeState,
        afterState,
        changes,
        metadata: {
          changeCount: changes.length
        }
      });
    }

    return serializeProject(updatedProject);
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
  },

  async getStats(projectId: string, userId: string) {
    // Verify user has access to project
    await ensureProjectAccess(projectId, userId);

    // Get all cards with their deck info (unfiltered by permission)
    const { data: cards, error } = await supabaseAdmin
      .from("sf_cards")
      .select("id, xp_value, deck_id, sf_decks(xp_payout)")
      .eq("project_id", projectId);

    if (error) {
      throw new AppError(error.message, 500);
    }

    // Calculate totals
    let totalXp = 0;
    let earnedXp = 0;

    if (cards && Array.isArray(cards)) {
      for (const card of cards) {
        const xpValue = (card as any).xp_value ?? 0;
        totalXp += xpValue;

        // Calculate earned XP based on deck payout
        const deckData = (card as any).sf_decks as any;
        const payout = (deckData?.xp_payout ?? 0) as number;
        earnedXp += Math.round((xpValue * payout) / 100);
      }
    }

    return {
      totalXp,
      earnedXp,
      cardCount: cards?.length ?? 0
    };
  }
};
