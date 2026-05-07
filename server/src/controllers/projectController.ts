import type { Request, Response } from "express";

import { AppError } from "../middleware/errorHandler.js";
import { projectService } from "../services/projectService.js";

export const projectController = {
  async list(request: Request, response: Response) {
    const projects = await projectService.list(request.user!.userId);
    return response.status(200).json({ data: projects });
  },

  async create(request: Request, response: Response) {
    const project = await projectService.create(request.user!.userId, request.body);
    return response.status(201).json({ data: project });
  },

  async getById(request: Request, response: Response) {
    const projectId =
      typeof request.params.projectId === "string" ? request.params.projectId : undefined;

    if (!projectId) {
      throw new AppError("Project id is required", 400);
    }

    const project = await projectService.getById(projectId, request.user!.userId);
    return response.status(200).json({ data: project });
  },

  async update(request: Request, response: Response) {
    const projectId =
      typeof request.params.projectId === "string" ? request.params.projectId : undefined;

    if (!projectId) {
      throw new AppError("Project id is required", 400);
    }

    const project = await projectService.update(projectId, request.user!.userId, request.body);
    return response.status(200).json({ data: project });
  },

  async remove(request: Request, response: Response) {
    const projectId =
      typeof request.params.projectId === "string" ? request.params.projectId : undefined;

    if (!projectId) {
      throw new AppError("Project id is required", 400);
    }

    await projectService.remove(projectId, request.user!.userId);
    return response.status(204).send();
  },

  async getStats(request: Request, response: Response) {
    const projectId =
      typeof request.params.projectId === "string" ? request.params.projectId : undefined;

    if (!projectId) {
      throw new AppError("Project id is required", 400);
    }

    const stats = await projectService.getStats(projectId, request.user!.userId);
    return response.status(200).json({ data: stats });
  }
};
