import type { NextFunction, Request, Response } from "express";

import { supabaseAdmin } from "../config/db.js";
import type { AuthenticatedUser } from "../types/auth.js";
import { AppError } from "./errorHandler.js";

export const resolveAuthenticatedUser = async (token: string): Promise<AuthenticatedUser | null> => {
  try {
    const {
      data: { user },
      error
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    const metadata = user.user_metadata as
      | {
          displayName?: string;
          firstName?: string;
          lastName?: string;
          statusMessage?: string;
          userCode?: string;
        }
      | undefined;

    return {
      userId: user.id,
      email: user.email ?? "",
      displayName: metadata?.displayName,
      firstName: metadata?.firstName,
      lastName: metadata?.lastName,
      statusMessage: metadata?.statusMessage,
      userCode: metadata?.userCode
    };
  } catch {
    return null;
  }
};

export const resolveAuthenticatedUserFromHeader = async (header?: string) => {
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return resolveAuthenticatedUser(header.slice(7));
};

export const requireAuth = async (request: Request, _response: Response, next: NextFunction) => {
  const header = request.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return next(new AppError("Authentication required", 401));
  }

  const user = await resolveAuthenticatedUser(header.slice(7));

  if (!user) {
    return next(new AppError("Invalid token", 401));
  }

  try {
    request.user = user;
    return next();
  } catch {
    return next(new AppError("Invalid token", 401));
  }
};
