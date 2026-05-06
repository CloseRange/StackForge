import type { CreateDeckInput, Deck, UpdateDeckInput } from "../types/api";
import { request } from "./api";

export const deckService = {
  listByProject(token: string, projectId: string) {
    return request<Deck[]>(`/decks/project/${projectId}`, { token });
  },

  create(token: string, payload: CreateDeckInput) {
    return request<Deck>("/decks", {
      method: "POST",
      token,
      body: payload
    });
  },

  update(token: string, deckId: string, payload: UpdateDeckInput) {
    return request<Deck>(`/decks/${deckId}`, {
      method: "PATCH",
      token,
      body: payload
    });
  },

  remove(token: string, deckId: string) {
    return request<void>(`/decks/${deckId}`, {
      method: "DELETE",
      token
    });
  }
};
