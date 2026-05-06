import { create } from "zustand";

import { cardService } from "../services/cardService";
import { deckService } from "../services/deckService";
import { projectService } from "../services/projectService";
import type {
  Card,
  CreateCardInput,
  CreateDeckInput,
  CreateProjectInput,
  Deck,
  Project,
  UpdateCardInput,
  UpdateDeckInput
} from "../types/api";

type BoardState = {
  projects: Project[];
  cards: Card[];
  decks: Deck[];
  selectedProjectId: string | null;
  isLoadingProjects: boolean;
  isLoadingCards: boolean;
  isLoadingDecks: boolean;
  error: string | null;
  selectProject: (projectId: string) => void;
  clearError: () => void;
  loadProjects: (token: string) => Promise<void>;
  createProject: (token: string, payload: CreateProjectInput) => Promise<Project>;
  loadCards: (token: string, projectId: string) => Promise<void>;
  loadDecks: (token: string, projectId: string) => Promise<void>;
  createCard: (token: string, payload: CreateCardInput) => Promise<Card>;
  createDeck: (token: string, payload: CreateDeckInput) => Promise<Deck>;
  updateDeck: (token: string, deckId: string, payload: UpdateDeckInput) => Promise<Deck>;
  removeDeck: (token: string, deckId: string) => Promise<void>;
  updateCard: (token: string, cardId: string, payload: UpdateCardInput) => Promise<Card>;
};

const replaceCard = (cards: Card[], nextCard: Card) =>
  cards.map((card) => (card.id === nextCard.id ? nextCard : card));

export const useBoardStore = create<BoardState>((set, get) => ({
  projects: [],
  cards: [],
  decks: [],
  selectedProjectId: null,
  isLoadingProjects: false,
  isLoadingCards: false,
  isLoadingDecks: false,
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
  async loadDecks(token, projectId) {
    set({ isLoadingDecks: true, error: null });

    try {
      const decks = await deckService.listByProject(token, projectId);
      set({ decks, isLoadingDecks: false });
    } catch (error) {
      set({
        decks: [],
        isLoadingDecks: false,
        error: error instanceof Error ? error.message : "Failed to load decks"
      });
    }
  },
  async createCard(token, payload) {
    const card = await cardService.create(token, payload);
    set((state) => ({ cards: [card, ...state.cards], error: null }));
    return card;
  },
  async createDeck(token, payload) {
    const deck = await deckService.create(token, payload);
    set((state) => ({ decks: [...state.decks, deck], error: null }));
    return deck;
  },
  async updateDeck(token, deckId, payload) {
    const deck = await deckService.update(token, deckId, payload);
    set((state) => ({
      decks: state.decks.map((item) => (item.id === deck.id ? deck : item)),
      error: null
    }));
    return deck;
  },
  async removeDeck(token, deckId) {
    await deckService.remove(token, deckId);
    set((state) => ({
      decks: state.decks.filter((deck) => deck.id !== deckId),
      error: null
    }));
  },
  async updateCard(token, cardId, payload) {
    const card = await cardService.update(token, cardId, payload);
    set((state) => ({ cards: replaceCard(state.cards, card), error: null }));
    return card;
  }
}));
