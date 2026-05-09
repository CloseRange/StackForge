import type { Request, Response } from "express";

import { AppError } from "../middleware/errorHandler.js";
import { memberService } from "../services/memberService.js";

export const memberController = {
  async list(request: Request, response: Response) {
    const projectId =
      typeof request.params.projectId === "string" ? request.params.projectId : undefined;

    if (!projectId) {
      throw new AppError("Project id is required", 400);
    }

    const result = await memberService.list(projectId, request.user!.userId);
    return response.status(200).json({ data: result });
  },

  async listRoles(request: Request, response: Response) {
    const projectId =
      typeof request.params.projectId === "string" ? request.params.projectId : undefined;

    if (!projectId) {
      throw new AppError("Project id is required", 400);
    }

    const roles = await memberService.listRoles(projectId, request.user!.userId);
    return response.status(200).json({ data: roles });
  },

  async createRole(request: Request, response: Response) {
    const projectId =
      typeof request.params.projectId === "string" ? request.params.projectId : undefined;

    if (!projectId) {
      throw new AppError("Project id is required", 400);
    }

    const role = await memberService.createRole(projectId, request.user!.userId, request.body);
    return response.status(201).json({ data: role });
  },

  async removeRole(request: Request, response: Response) {
    const projectId =
      typeof request.params.projectId === "string" ? request.params.projectId : undefined;
    const roleId =
      typeof request.params.roleId === "string" ? request.params.roleId : undefined;

    if (!projectId || !roleId) {
      throw new AppError("Project id and role id are required", 400);
    }

    await memberService.removeRole(projectId, request.user!.userId, roleId);
    return response.status(204).send();
  },

  async add(request: Request, response: Response) {
    const projectId =
      typeof request.params.projectId === "string" ? request.params.projectId : undefined;

    if (!projectId) {
      throw new AppError("Project id is required", 400);
    }

    const member = await memberService.add(projectId, request.user!.userId, request.body);
    return response.status(201).json({ data: member });
  },

  async remove(request: Request, response: Response) {
    const projectId =
      typeof request.params.projectId === "string" ? request.params.projectId : undefined;
    const targetUserId =
      typeof request.params.userId === "string" ? request.params.userId : undefined;

    if (!projectId || !targetUserId) {
      throw new AppError("Project id and user id are required", 400);
    }

    await memberService.remove(projectId, request.user!.userId, targetUserId);
    return response.status(204).send();
  },

  async updatePermissions(request: Request, response: Response) {
    const projectId =
      typeof request.params.projectId === "string" ? request.params.projectId : undefined;
    const targetUserId =
      typeof request.params.userId === "string" ? request.params.userId : undefined;

    if (!projectId || !targetUserId) {
      throw new AppError("Project id and user id are required", 400);
    }

    const member = await memberService.updatePermissions(
      projectId,
      request.user!.userId,
      targetUserId,
      request.body
    );

    return response.status(200).json({ data: member });
  }
};
