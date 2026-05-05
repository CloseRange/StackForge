import type { NextFunction, Request, Response } from "express";

import { supabaseAdmin } from "../config/db.js";
import { AppError } from "./errorHandler.js";

export const requireAuth = async (request: Request, _response: Response, next: NextFunction) => {
  const header = request.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return next(new AppError("Authentication required", 401));
  }

  const token = header.slice(7);

  try {
    const {
      data: { user },
      error
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return next(new AppError("Invalid token", 401));
    }

    request.user = {
      userId: user.id,
      email: user.email ?? "",
      displayName: (user.user_metadata as { displayName?: string } | undefined)?.displayName
    };

    return next();
  } catch {
    return next(new AppError("Invalid token", 401));
  }
};
