export type SFActivityEventRow = {
  id: string;
  project_id: string;
  actor_user_id: string | null;
  actor_display_name: string;
  actor_user_code: string | null;
  actor_avatar_url: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_label: string | null;
  summary: string;
  changes: unknown;
  before_state: unknown;
  after_state: unknown;
  metadata: unknown;
  created_at: string;
};
