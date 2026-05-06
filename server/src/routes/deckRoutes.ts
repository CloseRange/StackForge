import { Router } from "express";

import { deckController } from "../controllers/deckController.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const deckRouter = Router();

deckRouter.use(requireAuth);
deckRouter.get("/project/:projectId", asyncHandler(deckController.listByProject));
deckRouter.post("/", asyncHandler(deckController.create));
deckRouter.patch("/:deckId", asyncHandler(deckController.update));
deckRouter.delete("/:deckId", asyncHandler(deckController.remove));
