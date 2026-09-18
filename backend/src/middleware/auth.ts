import type { RequestHandler } from "express";
import type { Role } from "@awards/shared";
import { AppError } from "./errors.js";

/**
 * Authentication / RBAC scaffolding. Clerk is NOT wired up yet.
 *
 * Intended flow once Clerk is added:
 *   1. `requireAuth` verifies the Clerk session token (Authorization: Bearer ...)
 *   2. It looks up the local `users` row by `clerk_user_id` and sets `req.auth`
 *   3. `requireRole(...)` checks `req.auth.role` against the allowed roles
 *
 * Until then both fail closed so nothing protected is accidentally exposed.
 */
export const requireAuth: RequestHandler = (_req, _res, next) => {
  next(new AppError(501, "AUTH_NOT_CONFIGURED", "Authentication is not configured yet"));
};

export function requireRole(...allowed: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) {
      return next(new AppError(401, "UNAUTHENTICATED", "Authentication required"));
    }
    if (!allowed.includes(req.auth.role)) {
      return next(new AppError(403, "FORBIDDEN", "Insufficient permissions"));
    }
    next();
  };
}
