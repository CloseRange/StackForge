import type { Request, Response } from "express";

import { AppError } from "../middleware/errorHandler.js";
import { cardService } from "../services/cardService.js";

export const cardController = {
  async listByProject(request: Request, response: Response) {
    const projectId =
      typeof request.params.projectId === "string" ? request.params.projectId : undefined;

    if (!projectId) {
      throw new AppError("Project id is required", 400);
    }

    const cards = await cardService.listByProject(projectId, request.user!.userId);
    return response.status(200).json({ data: cards });
  },

  async create(request: Request, response: Response) {
    const card = await cardService.create(request.user!.userId, request.body);
    return response.status(201).json({ data: card });
  },

  async update(request: Request, response: Response) {
    const cardId = typeof request.params.cardId === "string" ? request.params.cardId : undefined;

    if (!cardId) {
      throw new AppError("Card id is required", 400);
    }

    const card = await cardService.update(cardId, request.user!.userId, request.body);
    return response.status(200).json({ data: card });
  },

  async assign(request: Request, response: Response) {
    const cardId = typeof request.params.cardId === "string" ? request.params.cardId : undefined;

    if (!cardId) {
      throw new AppError("Card id is required", 400);
    }

    const card = await cardService.assign(cardId, request.user!.userId, request.body);
    return response.status(200).json({ data: card });
  },

  async remove(request: Request, response: Response) {
    const cardId = typeof request.params.cardId === "string" ? request.params.cardId : undefined;

    if (!cardId) {
      throw new AppError("Card id is required", 400);
    }

    await cardService.remove(cardId, request.user!.userId);
    return response.status(204).send();
  }
};
