import type { RequestHandler } from "express";
import { z } from "zod";
import { validated } from "../middleware/validate.js";
import * as categoriesService from "../services/categories.service.js";

export const listCategoriesQuery = z.object({
  active: z.enum(["true", "false"]).optional(),
});

export const listCategories: RequestHandler = async (_req, res) => {
  const { query } = validated<{ query: z.infer<typeof listCategoriesQuery> }>(res);
  const active = query.active === undefined ? undefined : query.active === "true";
  res.json({ data: await categoriesService.listCategories({ active }) });
};
