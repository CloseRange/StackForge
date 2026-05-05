export type SFProjectRow = {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
};

export type SFProjectWithCount = SFProjectRow & {
  sf_cards: { count: number }[];
};
