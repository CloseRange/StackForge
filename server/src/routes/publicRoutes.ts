import { Router } from "express";

import { publicController } from "../controllers/publicController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const publicRouter = Router();

// No auth middleware — these routes are intentionally unauthenticated
publicRouter.get("/documentation/readme", asyncHandler(publicController.getReadme));
publicRouter.post("/admin-messages", asyncHandler(publicController.createAdminMessage));
publicRouter.get("/:userCode/:projectSlug", asyncHandler(publicController.getProject));
