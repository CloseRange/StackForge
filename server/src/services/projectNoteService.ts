import { supabaseAdmin } from "../config/db.js";
import { AppError } from "../middleware/errorHandler.js";
import type { SFProjectUserNoteRow } from "../models/projectNoteModel.js";
import { ensureProjectAccess } from "../utils/projectAccess.js";
import { upsertProjectNoteSchema } from "../utils/validators.js";

type ProjectUserNote = {
  id: string;
  projectId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

const serializeProjectUserNote = (row: SFProjectUserNoteRow): ProjectUserNote => ({
  id: row.id,
  projectId: row.project_id,
  userId: row.user_id,
  content: row.content,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const getOrCreateNote = async (projectId: string, userId: string) => {
  const { data: existing, error: existingError } = await supabaseAdmin
    .from("sf_project_user_notes")
    .select("id, project_id, user_id, content, created_at, updated_at")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError) {
    throw new AppError(existingError.message, 500);
  }

  if (existing) {
    return existing as SFProjectUserNoteRow;
  }

  const { data: created, error: createError } = await supabaseAdmin
    .from("sf_project_user_notes")
    .insert({
      project_id: projectId,
      user_id: userId,
      content: ""
    })
    .select("id, project_id, user_id, content, created_at, updated_at")
    .single();

  if (createError || !created) {
    throw new AppError(createError?.message ?? "Failed to create note", 500);
  }

  return created as SFProjectUserNoteRow;
};

export const projectNoteService = {
  async getMyNote(projectId: string, userId: string) {
    await ensureProjectAccess(projectId, userId);
    const note = await getOrCreateNote(projectId, userId);
    return serializeProjectUserNote(note);
  },

  async upsertMyNote(projectId: string, userId: string, payload: unknown) {
    await ensureProjectAccess(projectId, userId);
    const input = upsertProjectNoteSchema.parse(payload);

    const { data, error } = await supabaseAdmin
      .from("sf_project_user_notes")
      .upsert(
        {
          project_id: projectId,
          user_id: userId,
          content: input.content
        },
        { onConflict: "project_id,user_id" }
      )
      .select("id, project_id, user_id, content, created_at, updated_at")
      .single();

    if (error || !data) {
      throw new AppError(error?.message ?? "Failed to save note", 500);
    }

    return serializeProjectUserNote(data as SFProjectUserNoteRow);
  }
};
