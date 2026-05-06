export type SFChecklistItemRow = {
  id: string;
  card_id: string;
  label: string;
  completed: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type SFCardRow = {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  difficulty: string;
  xp_value: number;
  assignee_id: string | null;
  deck_id: string;
  project_id: string;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type SFCardWithChecklist = SFCardRow & {
  checklist: SFChecklistItemRow[];
};
