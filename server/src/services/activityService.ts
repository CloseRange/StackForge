import { supabaseAdmin } from "../config/db.js";
import { AppError } from "../middleware/errorHandler.js";
import { getUserAlias, resolveUserDisplayName } from "../utils/userDisplay.js";
import type { SFActivityEventRow } from "../models/activityModel.js";
import { ensureProjectAccess } from "../utils/projectAccess.js";

type ActivityEntityType = "project" | "deck" | "card" | "member";

type ActivityAction =
  | "created"
  | "updated"
  | "deleted"
  | "assigned"
  | "member_added"
  | "member_removed"
  | "permissions_updated";

type ActivityFieldChange = {
  field: string;
  label: string;
  before: unknown;
  after: unknown;
};

type ActorMetadata = {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  userCode?: string;
};

type ActivityLogInput = {
  projectId: string;
  actorUserId: string;
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId?: string | null;
  entityLabel?: string | null;
  summary: string;
  changes?: ActivityFieldChange[];
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
};

const normalizeMetadata = (metadata: unknown): ActorMetadata => {
  if (!metadata || typeof metadata !== "object") {
    return {};
  }

  return metadata as ActorMetadata;
};

const toSerializableValue = (value: unknown): unknown => {
  if (value === undefined) {
    return null;
  }

  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => toSerializableValue(entry));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, toSerializableValue(entry)])
    );
  }

  return String(value);
};

const areValuesEqual = (left: unknown, right: unknown) => {
  return JSON.stringify(toSerializableValue(left)) === JSON.stringify(toSerializableValue(right));
};

export const buildActivityChanges = (
  beforeState: Record<string, unknown> | null,
  afterState: Record<string, unknown> | null,
  labels: Record<string, string>
) => {
  const keys = new Set<string>([
    ...Object.keys(beforeState ?? {}),
    ...Object.keys(afterState ?? {})
  ]);

  return [...keys]
    .filter((key) => !areValuesEqual(beforeState?.[key], afterState?.[key]))
    .map((key) => ({
      field: key,
      label: labels[key] ?? key,
      before: toSerializableValue(beforeState?.[key]),
      after: toSerializableValue(afterState?.[key])
    }));
};

const serializeEvent = (row: SFActivityEventRow) => ({
  id: row.id,
  projectId: row.project_id,
  action: row.action,
  entityType: row.entity_type,
  entityId: row.entity_id,
  entityLabel: row.entity_label,
  summary: row.summary,
  actor: {
    id: row.actor_user_id,
    displayName: row.actor_display_name,
    userCode: row.actor_user_code,
    avatarUrl: row.actor_avatar_url
  },
  changes: Array.isArray(row.changes) ? row.changes : [],
  beforeState:
    row.before_state && typeof row.before_state === "object"
      ? (row.before_state as Record<string, unknown>)
      : null,
  afterState:
    row.after_state && typeof row.after_state === "object"
      ? (row.after_state as Record<string, unknown>)
      : null,
  metadata: row.metadata && typeof row.metadata === "object" ? (row.metadata as Record<string, unknown>) : {},
  createdAt: row.created_at
});

const resolveActorSnapshot = async (userId: string) => {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);

  if (error || !data.user) {
    return {
      actorUserId: userId,
      actorDisplayName: "Operator",
      actorUserCode: null,
      actorAvatarUrl: null
    };
  }

  const metadata = normalizeMetadata(data.user.user_metadata);
  const aliasName = await getUserAlias(userId);

  return {
    actorUserId: data.user.id,
    actorDisplayName: resolveUserDisplayName(data.user.email, metadata, aliasName),
    actorUserCode: metadata.userCode?.trim()?.toUpperCase() ?? null,
    actorAvatarUrl: metadata.avatarUrl?.trim() || null
  };
};

export const activityService = {
  async log(input: ActivityLogInput) {
    const actor = await resolveActorSnapshot(input.actorUserId);

    const { error } = await supabaseAdmin.from("sf_activity_events").insert({
      project_id: input.projectId,
      actor_user_id: actor.actorUserId,
      actor_display_name: actor.actorDisplayName,
      actor_user_code: actor.actorUserCode,
      actor_avatar_url: actor.actorAvatarUrl,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      entity_label: input.entityLabel ?? null,
      summary: input.summary,
      changes: (input.changes ?? []).map((change) => ({
        field: change.field,
        label: change.label,
        before: toSerializableValue(change.before),
        after: toSerializableValue(change.after)
      })),
      before_state: input.beforeState ? toSerializableValue(input.beforeState) : null,
      after_state: input.afterState ? toSerializableValue(input.afterState) : null,
      metadata: toSerializableValue(input.metadata ?? {})
    });

    if (error) {
      throw new AppError(error.message, 500);
    }
  },

  async listByProject(
    projectId: string,
    userId: string,
    options?: { limit?: number; entityType?: ActivityEntityType }
  ) {
    await ensureProjectAccess(projectId, userId);

    const limit = Math.max(1, Math.min(options?.limit ?? 30, 200));

    let filteredQuery = supabaseAdmin
      .from("sf_activity_events")
      .select("*", { count: "exact" })
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (options?.entityType) {
      filteredQuery = filteredQuery.eq("entity_type", options.entityType);
    }

    const [{ data, error, count }, { count: totalCount, error: totalError }, { count: weekCount, error: weekError }] = await Promise.all([
      filteredQuery,
      supabaseAdmin
        .from("sf_activity_events")
        .select("id", { count: "exact", head: true })
        .eq("project_id", projectId),
      supabaseAdmin
        .from("sf_activity_events")
        .select("id", { count: "exact", head: true })
        .eq("project_id", projectId)
        .gte("created_at", new Date(Date.now() - 604_800_000).toISOString())
    ]);

    if (error) {
      throw new AppError(error.message, 500);
    }

    if (totalError) {
      throw new AppError(totalError.message, 500);
    }

    if (weekError) {
      throw new AppError(weekError.message, 500);
    }

    return {
      events: (data as SFActivityEventRow[] | null)?.map(serializeEvent) ?? [],
      total: totalCount ?? 0,
      filteredTotal: count ?? 0,
      last7Days: weekCount ?? 0
    };
  }
};