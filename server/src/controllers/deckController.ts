import type { Request, Response } from "express";

import { AppError } from "../middleware/errorHandler.js";
import { deckService } from "../services/deckService.js";

export const deckController = {
  async listByProject(request: Request, response: Response) {
    const projectId =
      typeof request.params.projectId === "string" ? request.params.projectId : undefined;

    if (!projectId) {
      throw new AppError("Project id is required", 400);
    }

    const decks = await deckService.listByProject(projectId, request.user!.userId);
    return response.status(200).json({ data: decks });
  },

  async create(request: Request, response: Response) {
    const deck = await deckService.create(request.user!.userId, request.body);
    return response.status(201).json({ data: deck });
  },

  async update(request: Request, response: Response) {
    const deckId = typeof request.params.deckId === "string" ? request.params.deckId : undefined;

    if (!deckId) {
      throw new AppError("Deck id is required", 400);
    }

    const deck = await deckService.update(deckId, request.user!.userId, request.body);
    return response.status(200).json({ data: deck });
  },

  async remove(request: Request, response: Response) {
    const deckId = typeof request.params.deckId === "string" ? request.params.deckId : undefined;

    if (!deckId) {
      throw new AppError("Deck id is required", 400);
    }

    await deckService.remove(deckId, request.user!.userId);
    return response.status(204).send();
  }
};
