import { Router } from "express";

import { projectController } from "../controllers/projectController.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const projectRouter = Router();

projectRouter.use(requireAuth);
projectRouter.get("/", asyncHandler(projectController.list));
projectRouter.post("/", asyncHandler(projectController.create));
projectRouter.get("/:projectId", asyncHandler(projectController.getById));
projectRouter.patch("/:projectId", asyncHandler(projectController.update));
projectRouter.delete("/:projectId", asyncHandler(projectController.remove));
