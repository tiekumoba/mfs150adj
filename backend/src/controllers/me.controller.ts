import type { RequestHandler } from "express";

/** Returns the authenticated user. Placeholder until Clerk is integrated (see middleware/auth.ts). */
export const me: RequestHandler = (req, res) => {
  res.json({ data: req.auth });
};
