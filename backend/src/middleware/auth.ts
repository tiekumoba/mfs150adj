import { createClerkClient, verifyToken } from "@clerk/backend";
import type { RequestHandler } from "express";
import type { Role } from "@awards/shared";
import { env } from "../config/env.js";
import { AppError } from "./errors.js";
import * as usersService from "../services/users.service.js";

/**
 * Authentication and role-based access control.
 *
 * Clerk proves WHO the caller is (a signed session token). Our own `users` table decides
 * WHETHER they may use the system and with which role (ADMIN / ADJUDICATOR). Only people an
 * admin has added to `users` can get in; everyone else gets 403.
 */

let clerk: ReturnType<typeof createClerkClient> | undefined;
const getClerk = () => (clerk ??= createClerkClient({ secretKey: env.CLERK_SECRET_KEY }));

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    if (!env.CLERK_SECRET_KEY) {
      throw new AppError(501, "AUTH_NOT_CONFIGURED", "Authentication is not configured");
    }

    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
    if (!token) throw new AppError(401, "UNAUTHENTICATED", "Authentication required");

    let clerkUserId: string;
    try {
      const payload = await verifyToken(token, {
        secretKey: env.CLERK_SECRET_KEY,
        authorizedParties: env.corsOrigins,
      });
      clerkUserId = payload.sub;
    } catch {
      throw new AppError(401, "INVALID_TOKEN", "Invalid or expired session");
    }

    let user = await usersService.findActiveByClerkId(clerkUserId);

    if (!user) {
      // First sign-in: match the Clerk account to an invited user by VERIFIED email only.
      const clerkUser = await getClerk().users.getUser(clerkUserId);
      const primary = clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId);
      if (primary?.verification?.status === "verified") {
        user = await usersService.linkClerkUserByEmail(primary.emailAddress, clerkUserId);
      }
    }

    if (!user) {
      throw new AppError(403, "NOT_INVITED", "Your account has not been granted access");
    }

    req.auth = user;
    next();
  } catch (err) {
    next(err);
  }
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
