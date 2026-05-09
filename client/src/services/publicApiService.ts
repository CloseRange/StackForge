import type { Card, Deck, ProjectMilestone } from "../types/api";
import { request } from "./api";

export type PublicProjectData = {
  project: {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
  };
  decks: Deck[];
  cards: Card[];
  milestones: ProjectMilestone[];
};

export const publicApiService = {
  getProject(userCode: string, projectSlug: string) {
    return request<PublicProjectData>(`/public/${userCode}/${projectSlug}`);
  }
};
