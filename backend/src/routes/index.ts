import { Router } from "express";
import { listCategories, listCategoriesQuery } from "../controllers/categories.controller.js";
import { me } from "../controllers/me.controller.js";
import { adminStats } from "../controllers/stats.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { adjudicatorsRouter } from "./adjudicators.routes.js";
import { nominationsRouter } from "./nominations.routes.js";

/** All routes mounted under /api. Everything requires a signed-in, invited user. */
export const apiRouter = Router();
apiRouter.use(requireAuth);

apiRouter.get("/me", me);
apiRouter.get("/categories", validate({ query: listCategoriesQuery }), listCategories);

// Admin only. Adjudicators will get their own assignment-scoped routes later.
apiRouter.get("/admin/stats", requireRole("ADMIN"), adminStats);
apiRouter.use("/nominations", requireRole("ADMIN"), nominationsRouter);
apiRouter.use("/adjudicators", requireRole("ADMIN"), adjudicatorsRouter);
