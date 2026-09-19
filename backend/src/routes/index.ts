import { Router } from "express";
import { listCategories, listCategoriesQuery } from "../controllers/categories.controller.js";
import { me } from "../controllers/me.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

/** All routes mounted under /api. */
export const apiRouter = Router();

// Everything under /api requires a signed-in, invited user. Use requireRole(...) per route as needed.
apiRouter.use(requireAuth);

apiRouter.get("/me", me);
apiRouter.get("/categories", validate({ query: listCategoriesQuery }), listCategories);
