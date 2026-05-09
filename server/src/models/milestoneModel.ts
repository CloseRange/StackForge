export type MilestoneType = "CARD" | "DECK" | "XP" | "PROJECT";

export type SFProjectMilestoneRow = {
  id: string;
  project_id: string;
  type: MilestoneType;
  color: "sky" | "amber" | "emerald" | "rose" | "violet" | null;
  icon: string | null;
  title: string | null;
  due_at: string | null;
  target_card_id: string | null;
  target_deck_id: string | null;
  target_xp: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
