import { Router } from "express";
import {
  getNomination,
  listNominations,
  listNominationsQuery,
  nominationParams,
} from "../controllers/nominations.controller.js";
import { validate } from "../middleware/validate.js";

/** Mounted behind requireAuth + requireRole("ADMIN") (see routes/index.ts). */
export const nominationsRouter = Router();

nominationsRouter.get("/", validate({ query: listNominationsQuery }), listNominations);
nominationsRouter.get("/:id", validate({ params: nominationParams }), getNomination);
