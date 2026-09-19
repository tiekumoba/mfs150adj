import type { RequestHandler } from "express";
import { z } from "zod";
import { validated } from "../middleware/validate.js";
import { auditContextFrom } from "../services/audit.service.js";
import * as service from "../services/adjudicators.service.js";

export const createBody = z.object({
  email: z.email().max(254),
  fullName: z.string().trim().min(1).max(100),
});
export const idParams = z.object({ id: z.uuid() });
export const updateBody = z.object({ isActive: z.boolean() });

export const list: RequestHandler = async (_req, res) => {
  res.json({ data: await service.listAdjudicators() });
};

export const create: RequestHandler = async (req, res) => {
  const { body } = validated<{ body: z.infer<typeof createBody> }>(res);
  res.status(201).json({ data: await service.createAdjudicator(body, auditContextFrom(req)) });
};

export const update: RequestHandler = async (req, res) => {
  const { params, body } = validated<{
    params: z.infer<typeof idParams>;
    body: z.infer<typeof updateBody>;
  }>(res);
  res.json({ data: await service.setAdjudicatorActive(params.id, body.isActive, auditContextFrom(req)) });
};
