import type { Request, Response } from "express";

import { AppError } from "../middleware/errorHandler.js";
import { authService } from "../services/authService.js";

export const authController = {
  async register(request: Request, response: Response) {
    const result = await authService.register(request.body);
    return response.status(201).json({ data: result });
  },

  async login(request: Request, response: Response) {
    const result = await authService.login(request.body);
    return response.status(200).json({ data: result });
  },

  async getProfile(request: Request, response: Response) {
    if (!request.user) {
      throw new AppError("Authentication required", 401);
    }

    const result = await authService.getProfile(request.user.userId);
    return response.status(200).json({ data: result });
  },

  async updateProfile(request: Request, response: Response) {
    if (!request.user) {
      throw new AppError("Authentication required", 401);
    }

    const result = await authService.updateProfile(request.user.userId, request.body);
    return response.status(200).json({ data: result });
  },

  async uploadAvatar(request: Request, response: Response) {
    if (!request.user) {
      throw new AppError("Authentication required", 401);
    }

    const body = request.body;

    if (!Buffer.isBuffer(body) || body.length === 0) {
      throw new AppError("Avatar image file is required", 400);
    }

    const contentType = request.headers["content-type"];

    if (!contentType || typeof contentType !== "string") {
      throw new AppError("Content-Type must be an image type", 400);
    }

    const result = await authService.uploadAvatar(request.user.userId, {
      file: body,
      contentType
    });

    return response.status(200).json({ data: result });
  },

  async getSettings(request: Request, response: Response) {
    if (!request.user) {
      throw new AppError("Authentication required", 401);
    }

    const result = await authService.getSettings(request.user.userId);
    return response.status(200).json({ data: result });
  },

  async updateSettings(request: Request, response: Response) {
    if (!request.user) {
      throw new AppError("Authentication required", 401);
    }

    const result = await authService.updateSettings(request.user.userId, request.body);
    return response.status(200).json({ data: result });
  },

  async listNotifications(request: Request, response: Response) {
    if (!request.user) {
      throw new AppError("Authentication required", 401);
    }

    const result = await authService.listNotifications(request.user.userId, {
      limit: request.query.limit ? Number(request.query.limit) : undefined
    });

    return response.status(200).json({ data: result });
  },

  async markNotificationRead(request: Request, response: Response) {
    if (!request.user) {
      throw new AppError("Authentication required", 401);
    }

    const notificationId =
      typeof request.params.notificationId === "string" ? request.params.notificationId : undefined;

    if (!notificationId) {
      throw new AppError("Notification id is required", 400);
    }

    const result = await authService.markNotificationRead(request.user.userId, notificationId);
    return response.status(200).json({ data: result });
  },

  async markAllNotificationsRead(request: Request, response: Response) {
    if (!request.user) {
      throw new AppError("Authentication required", 401);
    }

    const result = await authService.markAllNotificationsRead(request.user.userId);
    return response.status(200).json({ data: result });
  },

  async updateEmail(request: Request, response: Response) {
    if (!request.user) {
      throw new AppError("Authentication required", 401);
    }

    const result = await authService.updateEmail(request.user.userId, request.body);
    return response.status(200).json({ data: result });
  },

  async updatePassword(request: Request, response: Response) {
    if (!request.user) {
      throw new AppError("Authentication required", 401);
    }

    const result = await authService.updatePassword(request.user.userId, request.body);
    return response.status(200).json({ data: result });
  }
};
