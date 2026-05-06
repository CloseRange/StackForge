export type SFDeckRow = {
  id: string;
  project_id: string;
  completion_target_deck_id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string;
  is_accessible: boolean;
  allow_assignment: boolean;
  is_system: boolean;
  system_key: string | null;
  xp_payout: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
};
