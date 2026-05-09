import type { Request, Response } from "express";

import { AppError } from "../middleware/errorHandler.js";
import { milestoneService } from "../services/milestoneService.js";

export const milestoneController = {
  async listByProject(request: Request, response: Response) {
    const projectId =
      typeof request.params.projectId === "string" ? request.params.projectId : undefined;

    if (!projectId) {
      throw new AppError("Project id is required", 400);
    }

    const milestones = await milestoneService.listByProject(projectId, request.user!.userId);
    return response.status(200).json({ data: milestones });
  },

  async create(request: Request, response: Response) {
    const projectId =
      typeof request.params.projectId === "string" ? request.params.projectId : undefined;

    if (!projectId) {
      throw new AppError("Project id is required", 400);
    }

    const milestone = await milestoneService.create(projectId, request.user!.userId, request.body);
    return response.status(201).json({ data: milestone });
  },

  async update(request: Request, response: Response) {
    const projectId =
      typeof request.params.projectId === "string" ? request.params.projectId : undefined;
    const milestoneId =
      typeof request.params.milestoneId === "string" ? request.params.milestoneId : undefined;

    if (!projectId || !milestoneId) {
      throw new AppError("Project id and milestone id are required", 400);
    }

    const milestone = await milestoneService.update(
      projectId,
      milestoneId,
      request.user!.userId,
      request.body
    );
    return response.status(200).json({ data: milestone });
  },

  async remove(request: Request, response: Response) {
    const projectId =
      typeof request.params.projectId === "string" ? request.params.projectId : undefined;
    const milestoneId =
      typeof request.params.milestoneId === "string" ? request.params.milestoneId : undefined;

    if (!projectId || !milestoneId) {
      throw new AppError("Project id and milestone id are required", 400);
    }

    await milestoneService.remove(projectId, milestoneId, request.user!.userId);
    return response.status(204).send();
  }
};
