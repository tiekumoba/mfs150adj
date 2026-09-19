import type { RequestHandler } from "express";
import { getAdminStats } from "../services/stats.service.js";

export const adminStats: RequestHandler = async (_req, res) => {
  res.json({ data: await getAdminStats() });
};
