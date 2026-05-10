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
  board_slot: number | null;
  deck_id: string;
  project_id: string;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type SFCardWithChecklist = SFCardRow & {
  checklist: SFChecklistItemRow[];
  dependencies?: SFCardDependencyRow[];
};

export type SFCardDependencyRow = {
  id: string;
  source_card_id: string;
  depends_on_card_id: string;
  required_deck_id: string | null;
  created_at: string;
};
