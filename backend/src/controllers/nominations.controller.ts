import type { RequestHandler } from "express";
import { z } from "zod";
import { AppError } from "../middleware/errors.js";
import { validated } from "../middleware/validate.js";
import * as nominationsService from "../services/nominations.service.js";

export const listNominationsQuery = z.object({
  categoryId: z.uuid().optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const nominationParams = z.object({ id: z.uuid() });

export const listNominations: RequestHandler = async (_req, res) => {
  const { query } = validated<{ query: z.infer<typeof listNominationsQuery> }>(res);
  res.json(
    await nominationsService.listNominations({
      categoryId: query.categoryId,
      search: query.q || undefined,
      page: query.page,
      pageSize: query.pageSize,
    }),
  );
};

export const getNomination: RequestHandler = async (_req, res) => {
  const { params } = validated<{ params: z.infer<typeof nominationParams> }>(res);
  const nomination = await nominationsService.getNomination(params.id);
  if (!nomination) throw new AppError(404, "NOT_FOUND", "Nomination not found");
  res.json({ data: nomination });
};
