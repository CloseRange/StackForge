export type SFDeckRow = {
  id: string;
  project_id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string;
  is_system: boolean;
  system_key: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};
