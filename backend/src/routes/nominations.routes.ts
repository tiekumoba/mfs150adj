import { Router } from "express";
import {
  addDocument,
  addDocumentBody,
  documentParams,
  getNomination,
  listNominations,
  listNominationsQuery,
  nominationHistory,
  nominationParams,
  removeDocument,
  updateNomination,
  updateNominationBody,
} from "../controllers/nominations.controller.js";
import { validate } from "../middleware/validate.js";

/** Mounted behind requireAuth + requireRole("ADMIN") (see routes/index.ts). */
export const nominationsRouter = Router();

nominationsRouter.get("/", validate({ query: listNominationsQuery }), listNominations);
nominationsRouter.get("/:id", validate({ params: nominationParams }), getNomination);
nominationsRouter.patch("/:id", validate({ params: nominationParams, body: updateNominationBody }), updateNomination);
nominationsRouter.get("/:id/history", validate({ params: nominationParams }), nominationHistory);
nominationsRouter.post("/:id/documents", validate({ params: nominationParams, body: addDocumentBody }), addDocument);
nominationsRouter.delete("/:id/documents/:documentId", validate({ params: documentParams }), removeDocument);
