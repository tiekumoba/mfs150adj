import type { RequestHandler } from "express";
import type { HealthResponse } from "@awards/shared";
import { checkDatabase } from "../db/pool.js";
import { AppError } from "../middleware/errors.js";

export const health: RequestHandler = (_req, res) => {
  const body: HealthResponse = {
    status: "ok",
    service: "awards-adjudication-api",
    timestamp: new Date().toISOString(),
  };
  res.json(body);
};

/** Also verifies the database connection. Use for manual checks, not the platform health probe. */
export const healthDb: RequestHandler = async (_req, res) => {
  try {
    await checkDatabase();
  } catch {
    throw new AppError(503, "DATABASE_UNAVAILABLE", "Database is not reachable");
  }
  res.json({ status: "ok", database: "up" });
};
