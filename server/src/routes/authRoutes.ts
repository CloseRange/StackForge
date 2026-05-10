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
authRouter.get("/notifications", requireAuth, asyncHandler(authController.listNotifications));
authRouter.patch(
	"/notifications/:notificationId/read",
	requireAuth,
	asyncHandler(authController.markNotificationRead)
);
authRouter.post(
	"/notifications/read-all",
	requireAuth,
	asyncHandler(authController.markAllNotificationsRead)
);
authRouter.put("/security/email", requireAuth, asyncHandler(authController.updateEmail));
authRouter.put("/security/password", requireAuth, asyncHandler(authController.updatePassword));
authRouter.post(
	"/profile/avatar",
	requireAuth,
	express.raw({ type: "image/*", limit: "5mb" }),
	asyncHandler(authController.uploadAvatar)
);
