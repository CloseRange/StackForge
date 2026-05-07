import { Router } from "express";

import { memberController } from "../controllers/memberController.js";
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

// Member management (owner-only writes, read open to members)
projectRouter.get("/:projectId/members", asyncHandler(memberController.list));
projectRouter.post("/:projectId/members", asyncHandler(memberController.add));
projectRouter.delete("/:projectId/members/:userId", asyncHandler(memberController.remove));
