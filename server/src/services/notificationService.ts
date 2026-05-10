import { supabaseAdmin } from "../config/db.js";
import { AppError } from "../middleware/errorHandler.js";
import type { SFProjectMilestoneRow } from "../models/milestoneModel.js";
import type { SFNotificationRow, SFNotificationType } from "../models/notificationModel.js";

type NotificationPreferenceKey =
  | "notify_milestone_due_soon"
  | "notify_milestone_completed"
  | "notify_added_to_project"
  | "notify_assigned_card_changed"
  | "notify_project_member_joined";

type PreferenceMap = Record<NotificationPreferenceKey, boolean>;

type UserSettingsRow = {
  user_id: string;
  notify_milestone_due_soon?: boolean;
  notify_milestone_completed?: boolean;
  notify_added_to_project?: boolean;
  notify_assigned_card_changed?: boolean;
  notify_project_member_joined?: boolean;
};

type MilestoneCardRow = {
  id: string;
  title: string;
  deck_id: string;
  xp_value: number;
};

type MilestoneDeckRow = {
  id: string;
  name: string;
  system_key: string | null;
  xp_payout: number;
};

type NotificationInsert = {
  user_id: string;
  project_id: string | null;
  type: SFNotificationType;
  title: string;
  body: string;
  dedupe_key: string;
  payload: Record<string, unknown>;
};

const defaultPreferences = (): PreferenceMap => ({
  notify_milestone_due_soon: true,
  notify_milestone_completed: true,
  notify_added_to_project: true,
  notify_assigned_card_changed: true,
  notify_project_member_joined: true
});

const isMissingNotificationPreferenceColumnsError = (message: string | null | undefined) =>
  (message ?? "").includes("sf_user_settings.notify_milestone_due_soon") ||
  (message ?? "").includes("sf_user_settings.notify_milestone_completed") ||
  (message ?? "").includes("sf_user_settings.notify_added_to_project") ||
  (message ?? "").includes("sf_user_settings.notify_assigned_card_changed") ||
  (message ?? "").includes("sf_user_settings.notify_project_member_joined");

const isMissingNotificationsTableError = (message: string | null | undefined) =>
  (message ?? "").includes("sf_notifications");

const normalizePreferences = (row: UserSettingsRow | undefined): PreferenceMap => ({
  notify_milestone_due_soon: row?.notify_milestone_due_soon ?? true,
  notify_milestone_completed: row?.notify_milestone_completed ?? true,
  notify_added_to_project: row?.notify_added_to_project ?? true,
  notify_assigned_card_changed: row?.notify_assigned_card_changed ?? true,
  notify_project_member_joined: row?.notify_project_member_joined ?? true
});

const listProjectUserIds = async (projectId: string) => {
  const [{ data: project, error: projectError }, { data: members, error: membersError }] = await Promise.all([
    supabaseAdmin.from("sf_projects").select("owner_id").eq("id", projectId).maybeSingle(),
    supabaseAdmin.from("sf_project_members").select("user_id").eq("project_id", projectId)
  ]);

  if (projectError) {
    throw new AppError(projectError.message, 500);
  }

  if (membersError) {
    throw new AppError(membersError.message, 500);
  }

  const ownerId = (project as { owner_id?: string } | null)?.owner_id;
  const result = new Set<string>();

  if (ownerId) {
    result.add(ownerId);
  }

  for (const row of (members ?? []) as Array<{ user_id: string }>) {
    result.add(row.user_id);
  }

  return [...result];
};

const getNotificationPreferences = async (userIds: string[]) => {
  if (userIds.length === 0) {
    return new Map<string, PreferenceMap>();
  }

  const { data, error } = await supabaseAdmin
    .from("sf_user_settings")
    .select("user_id, notify_milestone_due_soon, notify_milestone_completed, notify_added_to_project, notify_assigned_card_changed, notify_project_member_joined")
    .in("user_id", userIds);

  if (error && !isMissingNotificationPreferenceColumnsError(error.message)) {
    throw new AppError(error.message, 500);
  }

  if (error && isMissingNotificationPreferenceColumnsError(error.message)) {
    return new Map(userIds.map((userId) => [userId, defaultPreferences()]));
  }

  const map = new Map<string, PreferenceMap>();
  const rows = (data ?? []) as UserSettingsRow[];

  for (const row of rows) {
    map.set(row.user_id, normalizePreferences(row));
  }

  for (const userId of userIds) {
    if (!map.has(userId)) {
      map.set(userId, defaultPreferences());
    }
  }

  return map;
};

const insertNotifications = async (rows: NotificationInsert[]) => {
  if (rows.length === 0) {
    return;
  }

  const { error } = await supabaseAdmin.from("sf_notifications").upsert(rows, {
    onConflict: "user_id,dedupe_key",
    ignoreDuplicates: true
  });

  if (error && !isMissingNotificationsTableError(error.message)) {
    throw new AppError(error.message, 500);
  }
};

const ensureWelcomeNotification = async (userId: string) => {
  await insertNotifications([
    {
      user_id: userId,
      project_id: null,
      type: "welcome",
      title: "Welcome to StackForge",
      body: "Your notification center is live. You'll see project, card, and milestone updates here.",
      dedupe_key: `welcome:${userId}`,
      payload: {}
    }
  ]);
};

const getMilestoneContext = async (projectId: string) => {
  const [{ data: decks, error: decksError }, { data: cards, error: cardsError }] = await Promise.all([
    supabaseAdmin
      .from("sf_decks")
      .select("id, name, system_key, xp_payout")
      .eq("project_id", projectId),
    supabaseAdmin
      .from("sf_cards")
      .select("id, title, deck_id, xp_value")
      .eq("project_id", projectId)
  ]);

  if (decksError) {
    throw new AppError(decksError.message, 500);
  }

  if (cardsError) {
    throw new AppError(cardsError.message, 500);
  }

  const deckRows = (decks ?? []) as MilestoneDeckRow[];
  const cardRows = (cards ?? []) as MilestoneCardRow[];
  const completedDeckId = deckRows.find((deck) => deck.system_key === "COMPLETED")?.id ?? null;

  const payoutByDeckId = new Map(deckRows.map((deck) => [deck.id, deck.xp_payout ?? 0]));
  const totalXp = cardRows.reduce((sum, card) => sum + (card.xp_value ?? 0), 0);
  const earnedXp = cardRows.reduce((sum, card) => {
    const payout = payoutByDeckId.get(card.deck_id) ?? 0;
    return sum + Math.round((card.xp_value * payout) / 100);
  }, 0);

  return {
    cardRows,
    completedDeckId,
    totalXp,
    earnedXp
  };
};

const isMilestoneComplete = (
  milestone: SFProjectMilestoneRow,
  context: { cardRows: MilestoneCardRow[]; completedDeckId: string | null; totalXp: number; earnedXp: number }
) => {
  if (milestone.type === "CARD") {
    const card = milestone.target_card_id
      ? context.cardRows.find((entry) => entry.id === milestone.target_card_id)
      : null;

    return Boolean(card && context.completedDeckId && card.deck_id === context.completedDeckId);
  }

  if (milestone.type === "DECK") {
    return Boolean(milestone.target_deck_id) && !context.cardRows.some((card) => card.deck_id === milestone.target_deck_id);
  }

  if (milestone.type === "XP") {
    return context.earnedXp >= (milestone.target_xp ?? 0);
  }

  return context.totalXp > 0 && context.earnedXp >= context.totalXp;
};

const resolveMilestoneTitle = (milestone: SFProjectMilestoneRow) => {
  const explicit = milestone.title?.trim();

  if (explicit) {
    return explicit;
  }

  if (milestone.type === "XP") {
    return `Reach ${milestone.target_xp ?? 0} XP`;
  }

  if (milestone.type === "PROJECT") {
    return "Project complete";
  }

  return "Milestone";
};

const mapNotification = (row: SFNotificationRow) => ({
  id: row.id,
  userId: row.user_id,
  projectId: row.project_id,
  type: row.type,
  title: row.title,
  body: row.body,
  payload: row.payload && typeof row.payload === "object" ? (row.payload as Record<string, unknown>) : {},
  isRead: row.is_read,
  readAt: row.read_at,
  createdAt: row.created_at
});

export const notificationService = {
  async ensureWelcomeForUser(userId: string) {
    await ensureWelcomeNotification(userId);
  },

  async listByUser(userId: string, options?: { limit?: number }) {
    await ensureWelcomeNotification(userId);
    await this.syncDueSoonMilestonesForUser(userId);

    const limit = Math.max(1, Math.min(options?.limit ?? 30, 100));

    const [{ data, error }, { count, error: unreadError }] = await Promise.all([
      supabaseAdmin
        .from("sf_notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit),
      supabaseAdmin
        .from("sf_notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false)
    ]);

    if (error) {
      if (isMissingNotificationsTableError(error.message)) {
        return {
          notifications: [],
          unreadCount: 0
        };
      }

      throw new AppError(error.message, 500);
    }

    if (unreadError) {
      if (isMissingNotificationsTableError(unreadError.message)) {
        return {
          notifications: [],
          unreadCount: 0
        };
      }

      throw new AppError(unreadError.message, 500);
    }

    return {
      notifications: ((data ?? []) as SFNotificationRow[]).map(mapNotification),
      unreadCount: count ?? 0
    };
  },

  async markAsRead(userId: string, notificationId: string) {
    const { data, error } = await supabaseAdmin
      .from("sf_notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("user_id", userId)
      .select("*")
      .maybeSingle();

    if (error && !isMissingNotificationsTableError(error.message)) {
      throw new AppError(error.message, 500);
    }

    if (error && isMissingNotificationsTableError(error.message)) {
      throw new AppError("Notifications are not available yet", 404);
    }

    if (!data) {
      throw new AppError("Notification not found", 404);
    }

    return mapNotification(data as SFNotificationRow);
  },

  async markAllAsRead(userId: string) {
    const { error } = await supabaseAdmin
      .from("sf_notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error && !isMissingNotificationsTableError(error.message)) {
      throw new AppError(error.message, 500);
    }

    if (error && isMissingNotificationsTableError(error.message)) {
      return { success: true };
    }

    return { success: true };
  },

  async notifyAddedToProject(input: {
    projectId: string;
    projectName: string;
    addedUserId: string;
    actorUserId: string;
  }) {
    const preferences = await getNotificationPreferences([input.addedUserId]);

    if (!preferences.get(input.addedUserId)?.notify_added_to_project) {
      return;
    }

    await insertNotifications([
      {
        user_id: input.addedUserId,
        project_id: input.projectId,
        type: "added_to_project",
        title: "You were added to a project",
        body: `You were added to ${input.projectName}.`,
        dedupe_key: `added-to-project:${input.projectId}:${input.addedUserId}`,
        payload: {
          projectId: input.projectId,
          actorUserId: input.actorUserId
        }
      }
    ]);
  },

  async notifyProjectMemberJoined(input: {
    projectId: string;
    projectName: string;
    joinedUserId: string;
    joinedDisplayName: string;
    actorUserId: string;
  }) {
    const allProjectUserIds = await listProjectUserIds(input.projectId);
    const recipients = allProjectUserIds.filter(
      (userId) => userId !== input.joinedUserId && userId !== input.actorUserId
    );

    if (recipients.length === 0) {
      return;
    }

    const preferences = await getNotificationPreferences(recipients);

    await insertNotifications(
      recipients
        .filter((userId) => preferences.get(userId)?.notify_project_member_joined)
        .map((userId) => ({
          user_id: userId,
          project_id: input.projectId,
          type: "project_member_joined" as const,
          title: "New project member",
          body: `${input.joinedDisplayName} joined ${input.projectName}.`,
          dedupe_key: `member-joined:${input.projectId}:${input.joinedUserId}:${userId}`,
          payload: {
            projectId: input.projectId,
            joinedUserId: input.joinedUserId,
            actorUserId: input.actorUserId
          }
        }))
    );
  },

  async notifyAssignedCardChanged(input: {
    projectId: string;
    cardId: string;
    cardTitle: string;
    assigneeId: string | null;
    actorUserId: string;
    message: string;
  }) {
    if (!input.assigneeId || input.assigneeId === input.actorUserId) {
      return;
    }

    const preferences = await getNotificationPreferences([input.assigneeId]);

    if (!preferences.get(input.assigneeId)?.notify_assigned_card_changed) {
      return;
    }

    await insertNotifications([
      {
        user_id: input.assigneeId,
        project_id: input.projectId,
        type: "assigned_card_changed",
        title: `Assigned card updated: ${input.cardTitle}`,
        body: input.message,
        dedupe_key: `card-changed:${input.cardId}:${new Date().toISOString().slice(0, 16)}`,
        payload: {
          cardId: input.cardId,
          projectId: input.projectId,
          actorUserId: input.actorUserId
        }
      }
    ]);
  },

  async syncMilestoneCompletionForProject(projectId: string, actorUserId?: string) {
    const [{ data: milestones, error: milestonesError }, { data: project, error: projectError }, context] =
      await Promise.all([
        supabaseAdmin
          .from("sf_project_milestones")
          .select("*")
          .eq("project_id", projectId),
        supabaseAdmin.from("sf_projects").select("name").eq("id", projectId).maybeSingle(),
        getMilestoneContext(projectId)
      ]);

    if (milestonesError) {
      throw new AppError(milestonesError.message, 500);
    }

    if (projectError) {
      throw new AppError(projectError.message, 500);
    }

    const projectName = (project as { name?: string } | null)?.name ?? "project";
    const completed = ((milestones ?? []) as SFProjectMilestoneRow[]).filter((milestone) =>
      isMilestoneComplete(milestone, context)
    );

    if (completed.length === 0) {
      return;
    }

    const recipients = await listProjectUserIds(projectId);

    if (recipients.length === 0) {
      return;
    }

    const preferences = await getNotificationPreferences(recipients);

    const rows: NotificationInsert[] = [];

    for (const milestone of completed) {
      const title = resolveMilestoneTitle(milestone);

      for (const userId of recipients) {
        if (!preferences.get(userId)?.notify_milestone_completed) {
          continue;
        }

        rows.push({
          user_id: userId,
          project_id: projectId,
          type: "milestone_completed",
          title: `Milestone completed: ${title}`,
          body: `A milestone in ${projectName} has been completed.`,
          dedupe_key: `milestone-complete:${milestone.id}:${userId}`,
          payload: {
            projectId,
            milestoneId: milestone.id
          }
        });
      }
    }

    await insertNotifications(rows);
  },

  async syncDueSoonMilestonesForUser(userId: string) {
    const now = new Date();
    const cutoff = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const [ownedProjects, memberProjects, preferences] = await Promise.all([
      supabaseAdmin.from("sf_projects").select("id").eq("owner_id", userId),
      supabaseAdmin.from("sf_project_members").select("project_id").eq("user_id", userId),
      getNotificationPreferences([userId])
    ]);

    if (ownedProjects.error) {
      throw new AppError(ownedProjects.error.message, 500);
    }

    if (memberProjects.error) {
      throw new AppError(memberProjects.error.message, 500);
    }

    if (!preferences.get(userId)?.notify_milestone_due_soon) {
      return;
    }

    const projectIds = new Set<string>();

    for (const row of (ownedProjects.data ?? []) as Array<{ id: string }>) {
      projectIds.add(row.id);
    }

    for (const row of (memberProjects.data ?? []) as Array<{ project_id: string }>) {
      projectIds.add(row.project_id);
    }

    if (projectIds.size === 0) {
      return;
    }

    const { data: milestones, error: milestonesError } = await supabaseAdmin
      .from("sf_project_milestones")
      .select("*")
      .in("project_id", [...projectIds])
      .gte("due_at", now.toISOString())
      .lte("due_at", cutoff.toISOString());

    if (milestonesError) {
      throw new AppError(milestonesError.message, 500);
    }

    const milestoneRows = (milestones ?? []) as SFProjectMilestoneRow[];

    if (milestoneRows.length === 0) {
      return;
    }

    const rows: NotificationInsert[] = [];
    const projectNameCache = new Map<string, string>();

    for (const projectId of projectIds) {
      const [contextResult, projectResult] = await Promise.all([
        getMilestoneContext(projectId),
        supabaseAdmin.from("sf_projects").select("name").eq("id", projectId).maybeSingle()
      ]);

      if (projectResult.error) {
        throw new AppError(projectResult.error.message, 500);
      }

      projectNameCache.set(projectId, (projectResult.data as { name?: string } | null)?.name ?? "project");

      for (const milestone of milestoneRows.filter((item) => item.project_id === projectId)) {
        if (isMilestoneComplete(milestone, contextResult)) {
          continue;
        }

        const dueAt = milestone.due_at ? new Date(milestone.due_at) : null;

        if (!dueAt) {
          continue;
        }

        const title = resolveMilestoneTitle(milestone);
        const projectName = projectNameCache.get(projectId) ?? "project";

        rows.push({
          user_id: userId,
          project_id: projectId,
          type: "milestone_due_soon",
          title: `Due soon: ${title}`,
          body: `${projectName} milestone is due ${dueAt.toLocaleString()}.`,
          dedupe_key: `milestone-due-soon:${milestone.id}:${userId}`,
          payload: {
            projectId,
            milestoneId: milestone.id,
            dueAt: milestone.due_at
          }
        });
      }
    }

    await insertNotifications(rows);
  }
};
