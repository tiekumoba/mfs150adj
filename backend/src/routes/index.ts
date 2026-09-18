import { Router } from "express";
import { listCategories, listCategoriesQuery } from "../controllers/categories.controller.js";
import { me } from "../controllers/me.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

/** All routes mounted under /api. */
export const apiRouter = Router();

// NOTE: unauthenticated for now. Add `requireAuth, requireRole("ADMIN")` when Clerk is wired up.
apiRouter.get("/categories", validate({ query: listCategoriesQuery }), listCategories);
apiRouter.get("/me", requireAuth, me);
