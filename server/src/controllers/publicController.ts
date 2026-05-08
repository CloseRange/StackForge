import type { Request, Response } from "express";

import { AppError } from "../middleware/errorHandler.js";
import { publicService } from "../services/publicService.js";

export const publicController = {
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
