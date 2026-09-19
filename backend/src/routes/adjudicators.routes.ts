import { Router } from "express";
import { create, createBody, idParams, list, update, updateBody } from "../controllers/adjudicators.controller.js";
import { validate } from "../middleware/validate.js";

/** Mounted behind requireAuth + requireRole("ADMIN") (see routes/index.ts). */
export const adjudicatorsRouter = Router();

adjudicatorsRouter.get("/", list);
adjudicatorsRouter.post("/", validate({ body: createBody }), create);
adjudicatorsRouter.patch("/:id", validate({ params: idParams, body: updateBody }), update);
