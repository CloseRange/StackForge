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
  type: string;
  priority: string;
  difficulty: number;
  xp_value: number;
  status: string;
  assignee_id: string | null;
  project_id: string;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type SFCardWithChecklist = SFCardRow & {
  checklist: SFChecklistItemRow[];
};
