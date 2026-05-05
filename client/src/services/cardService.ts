import type { Card, CardStatus, CreateCardInput, UpdateCardInput } from "../types/api";
import { request } from "./api";

export const cardService = {
  listByProject(token: string, projectId: string) {
    return request<Card[]>(`/cards/project/${projectId}`, { token });
  },

  create(token: string, payload: CreateCardInput) {
    return request<Card>("/cards", {
      method: "POST",
      token,
      body: payload
    });
  },

  update(token: string, cardId: string, payload: UpdateCardInput) {
    return request<Card>(`/cards/${cardId}`, {
      method: "PATCH",
      token,
      body: payload
    });
  },

  move(token: string, cardId: string, status: CardStatus) {
    return request<Card>(`/cards/${cardId}/move`, {
      method: "POST",
      token,
      body: { status }
    });
  }
};
