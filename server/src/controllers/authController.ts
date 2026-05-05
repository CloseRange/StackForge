import type { Request, Response } from "express";

import { authService } from "../services/authService.js";

export const authController = {
  async register(request: Request, response: Response) {
    const result = await authService.register(request.body);
    return response.status(201).json({ data: result });
  },

  async login(request: Request, response: Response) {
    const result = await authService.login(request.body);
    return response.status(200).json({ data: result });
  }
};
