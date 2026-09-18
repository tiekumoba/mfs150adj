import { Router } from "express";
import * as controller from "../controllers/health.controller.js";

export const healthRouter = Router();

healthRouter.get("/", controller.health);
healthRouter.get("/db", controller.healthDb);
