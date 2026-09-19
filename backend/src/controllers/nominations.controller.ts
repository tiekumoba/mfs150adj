import type { RequestHandler } from "express";
import { z } from "zod";
import { AppError } from "../middleware/errors.js";
import { validated } from "../middleware/validate.js";
import { auditContextFrom } from "../services/audit.service.js";
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

export const updateNominationBody = z
  .object({
    nomineeName: z.string().trim().min(1).max(200),
    nominatorName: z.string().max(200).nullable(),
    citation: z.string().max(20000).nullable(),
    categoryId: z.uuid(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "Provide at least one field to update" });

export const documentParams = z.object({ id: z.uuid(), documentId: z.uuid() });

export const addDocumentBody = z.object({
  kind: z.enum(["image", "document", "video", "external_link"]),
  url: z
    .url()
    .max(2000)
    .refine((u) => /^https?:\/\//i.test(u), { message: "URL must start with http:// or https://" }),
  fileName: z.string().trim().max(255).nullish(),
});

export const updateNomination: RequestHandler = async (req, res) => {
  const { params, body } = validated<{
    params: z.infer<typeof nominationParams>;
    body: z.infer<typeof updateNominationBody>;
  }>(res);
  res.json({ data: await nominationsService.updateNomination(params.id, body, auditContextFrom(req)) });
};

export const addDocument: RequestHandler = async (req, res) => {
  const { params, body } = validated<{
    params: z.infer<typeof nominationParams>;
    body: z.infer<typeof addDocumentBody>;
  }>(res);
  res.status(201).json({ data: await nominationsService.addDocument(params.id, body, auditContextFrom(req)) });
};

export const removeDocument: RequestHandler = async (req, res) => {
  const { params } = validated<{ params: z.infer<typeof documentParams> }>(res);
  res.json({ data: await nominationsService.removeDocument(params.id, params.documentId, auditContextFrom(req)) });
};

export const nominationHistory: RequestHandler = async (_req, res) => {
  const { params } = validated<{ params: z.infer<typeof nominationParams> }>(res);
  res.json({ data: await nominationsService.getNominationHistory(params.id) });
};
