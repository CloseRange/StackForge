import type { Card, CreateCardInput, UpdateCardInput } from "../types/api";
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

  remove(token: string, cardId: string) {
    return request<void>(`/cards/${cardId}`, {
      method: "DELETE",
      token
    });
  }
};
