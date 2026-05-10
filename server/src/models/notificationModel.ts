export type SFNotificationType =
  | "welcome"
  | "milestone_due_soon"
  | "milestone_completed"
  | "added_to_project"
  | "assigned_card_changed"
  | "project_member_joined";

export type SFNotificationRow = {
  id: string;
  user_id: string;
  project_id: string | null;
  type: SFNotificationType;
  title: string;
  body: string;
  dedupe_key: string;
  payload: unknown;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};
