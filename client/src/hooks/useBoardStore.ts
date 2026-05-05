import { create } from "zustand";

import { cardService } from "../services/cardService";
import { projectService } from "../services/projectService";
import type { Card, CardStatus, CreateCardInput, CreateProjectInput, Project, UpdateCardInput } from "../types/api";

type BoardState = {
  projects: Project[];
  cards: Card[];
  selectedProjectId: string | null;
  isLoadingProjects: boolean;
  isLoadingCards: boolean;
  error: string | null;
  selectProject: (projectId: string) => void;
  clearError: () => void;
  loadProjects: (token: string) => Promise<void>;
  createProject: (token: string, payload: CreateProjectInput) => Promise<Project>;
  loadCards: (token: string, projectId: string) => Promise<void>;
  createCard: (token: string, payload: CreateCardInput) => Promise<Card>;
  updateCard: (token: string, cardId: string, payload: UpdateCardInput) => Promise<Card>;
  moveCard: (token: string, cardId: string, status: CardStatus) => Promise<void>;
};

const replaceCard = (cards: Card[], nextCard: Card) =>
  cards.map((card) => (card.id === nextCard.id ? nextCard : card));

export const useBoardStore = create<BoardState>((set, get) => ({
  projects: [],
  cards: [],
  selectedProjectId: null,
  isLoadingProjects: false,
  isLoadingCards: false,
  error: null,
  selectProject: (projectId) => set({ selectedProjectId: projectId }),
  clearError: () => set({ error: null }),
  async loadProjects(token) {
    set({ isLoadingProjects: true, error: null });

    try {
      const projects = await projectService.list(token);
      const selectedProjectId = get().selectedProjectId ?? projects[0]?.id ?? null;
      set({ projects, selectedProjectId, isLoadingProjects: false });
    } catch (error) {
      set({
        isLoadingProjects: false,
        error: error instanceof Error ? error.message : "Failed to load projects"
      });
    }
  },
  async createProject(token, payload) {
    const project = await projectService.create(token, payload);
    set((state) => ({
      projects: [project, ...state.projects],
      selectedProjectId: project.id,
      error: null
    }));
    return project;
  },
  async loadCards(token, projectId) {
    set({ isLoadingCards: true, error: null });

    try {
      const cards = await cardService.listByProject(token, projectId);
      set({ cards, isLoadingCards: false });
    } catch (error) {
      set({
        cards: [],
        isLoadingCards: false,
        error: error instanceof Error ? error.message : "Failed to load cards"
      });
    }
  },
  async createCard(token, payload) {
    const card = await cardService.create(token, payload);
    set((state) => ({ cards: [card, ...state.cards], error: null }));
    return card;
  },
  async updateCard(token, cardId, payload) {
    const card = await cardService.update(token, cardId, payload);
    set((state) => ({ cards: replaceCard(state.cards, card), error: null }));
    return card;
  },
  async moveCard(token, cardId, status) {
    const currentCard = get().cards.find((card) => card.id === cardId);

    if (!currentCard || currentCard.status === status) {
      return;
    }

    set((state) => ({
      cards: replaceCard(state.cards, { ...currentCard, status }),
      error: null
    }));

    try {
      const updatedCard = await cardService.move(token, cardId, status);
      set((state) => ({ cards: replaceCard(state.cards, updatedCard) }));
    } catch (error) {
      set((state) => ({
        cards: replaceCard(state.cards, currentCard),
        error: error instanceof Error ? error.message : "Failed to move card"
      }));
    }
  }
}));
