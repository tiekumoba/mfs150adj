import type { RequestHandler } from "express";
import type { MeResponse } from "@awards/shared";

/** Returns the signed-in user and role (set by `requireAuth`). */
export const me: RequestHandler = (req, res) => {
  const { id, email, fullName, role } = req.auth!;
  const body: MeResponse = { data: { id, email, fullName, role } };
  res.json(body);
};
