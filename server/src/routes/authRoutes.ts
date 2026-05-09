import { Router } from "express";
import express from "express";

import { authController } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authRouter = Router();

authRouter.post("/register", asyncHandler(authController.register));
authRouter.post("/login", asyncHandler(authController.login));
authRouter.get("/profile", requireAuth, asyncHandler(authController.getProfile));
authRouter.put("/profile", requireAuth, asyncHandler(authController.updateProfile));
authRouter.get("/settings", requireAuth, asyncHandler(authController.getSettings));
authRouter.put("/settings", requireAuth, asyncHandler(authController.updateSettings));
authRouter.post(
	"/profile/avatar",
	requireAuth,
	express.raw({ type: "image/*", limit: "5mb" }),
	asyncHandler(authController.uploadAvatar)
);
