import type { Request, Response } from "express";

import { AppError } from "../middleware/errorHandler.js";
import { projectNoteService } from "../services/projectNoteService.js";

export const projectNoteController = {
  async getMyNote(request: Request, response: Response) {
    const projectId =
      typeof request.params.projectId === "string" ? request.params.projectId : undefined;

    if (!projectId) {
      throw new AppError("Project id is required", 400);
    }

    const note = await projectNoteService.getMyNote(projectId, request.user!.userId);
    return response.status(200).json({ data: note });
  },

  async upsertMyNote(request: Request, response: Response) {
    const projectId =
      typeof request.params.projectId === "string" ? request.params.projectId : undefined;

    if (!projectId) {
      throw new AppError("Project id is required", 400);
    }

    const note = await projectNoteService.upsertMyNote(projectId, request.user!.userId, request.body);
    return response.status(200).json({ data: note });
  }
};
