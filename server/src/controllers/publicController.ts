import type { Request, Response } from "express";

import { AppError } from "../middleware/errorHandler.js";
import { resolveAuthenticatedUserFromHeader } from "../middleware/auth.js";
import { publicService } from "../services/publicService.js";

export const publicController = {
  async getReadme(_request: Request, response: Response) {
    const data = await publicService.getReadme();
    return response.status(200).json({ data });
  },

  async createAdminMessage(request: Request, response: Response) {
    const user = await resolveAuthenticatedUserFromHeader(request.headers.authorization);
    const data = await publicService.createAdminMessage(request.body, user ?? undefined);
    return response.status(201).json({ data });
  },

  async getProject(request: Request, response: Response) {
    const userCode =
      typeof request.params.userCode === "string" ? request.params.userCode : undefined;
    const projectSlug =
      typeof request.params.projectSlug === "string" ? request.params.projectSlug : undefined;

    if (!userCode || !projectSlug) {
      throw new AppError("User code and project slug are required", 400);
    }

    const data = await publicService.getPublicProject(userCode, projectSlug);
    return response.status(200).json({ data });
  }
};
