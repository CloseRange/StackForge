import { Router } from "express";

import { cardController } from "../controllers/cardController.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const cardRouter = Router();

cardRouter.use(requireAuth);
cardRouter.get("/project/:projectId", asyncHandler(cardController.listByProject));
cardRouter.post("/", asyncHandler(cardController.create));
cardRouter.patch("/:cardId", asyncHandler(cardController.update));
cardRouter.post("/:cardId/assign", asyncHandler(cardController.assign));
cardRouter.delete("/:cardId", asyncHandler(cardController.remove));
