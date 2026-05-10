import { Router } from "express";

import { memberController } from "../controllers/memberController.js";
import { milestoneController } from "../controllers/milestoneController.js";
import { projectController } from "../controllers/projectController.js";
import { projectNoteController } from "../controllers/projectNoteController.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const projectRouter = Router();

projectRouter.use(requireAuth);
projectRouter.get("/", asyncHandler(projectController.list));
projectRouter.post("/", asyncHandler(projectController.create));
projectRouter.get("/:projectId", asyncHandler(projectController.getById));
projectRouter.get("/:projectId/activity", asyncHandler(projectController.getActivity));
projectRouter.get("/:projectId/stats", asyncHandler(projectController.getStats));
projectRouter.get("/:projectId/notes/me", asyncHandler(projectNoteController.getMyNote));
projectRouter.put("/:projectId/notes/me", asyncHandler(projectNoteController.upsertMyNote));
projectRouter.get("/:projectId/milestones", asyncHandler(milestoneController.listByProject));
projectRouter.post("/:projectId/milestones", asyncHandler(milestoneController.create));
projectRouter.patch("/:projectId/milestones/:milestoneId", asyncHandler(milestoneController.update));
projectRouter.delete("/:projectId/milestones/:milestoneId", asyncHandler(milestoneController.remove));
projectRouter.patch("/:projectId", asyncHandler(projectController.update));
projectRouter.delete("/:projectId", asyncHandler(projectController.remove));

// Role management
projectRouter.get("/:projectId/roles", asyncHandler(memberController.listRoles));
projectRouter.post("/:projectId/roles", asyncHandler(memberController.createRole));
projectRouter.patch("/:projectId/roles/:roleId/permissions", asyncHandler(memberController.updateRolePermissions));
projectRouter.delete("/:projectId/roles/:roleId", asyncHandler(memberController.removeRole));

// Member management (owner-only writes, read open to members)
projectRouter.get("/:projectId/members", asyncHandler(memberController.list));
projectRouter.post("/:projectId/members", asyncHandler(memberController.add));
projectRouter.patch("/:projectId/members/:userId", asyncHandler(memberController.updatePermissions));
projectRouter.delete("/:projectId/members/:userId", asyncHandler(memberController.remove));
