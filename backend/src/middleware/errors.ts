import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import type { ApiErrorBody } from "@awards/shared";
import { env } from "../config/env.js";

/** Throw from anywhere in a route/controller/service to produce a specific HTTP error. */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError(404, "NOT_FOUND", `Route not found: ${req.method} ${req.path}`));
};

// Express identifies error handlers by their 4-argument signature, so `_next` must stay.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let status = 500;
  let body: ApiErrorBody["error"] = { code: "INTERNAL_ERROR", message: "Internal server error" };

  if (err instanceof AppError) {
    status = err.status;
    body = { code: err.code, message: err.message, details: err.details };
  } else if (err instanceof ZodError) {
    status = 400;
    body = { code: "VALIDATION_ERROR", message: "Invalid request", details: err.issues };
  } else if (err instanceof SyntaxError && "body" in err) {
    status = 400;
    body = { code: "INVALID_JSON", message: "Malformed JSON body" };
  }

  if (status >= 500) {
    console.error(err);
    if (!env.isProduction && err instanceof Error) body.message = err.message;
  }

  res.status(status).json({ error: body } satisfies ApiErrorBody);
};
