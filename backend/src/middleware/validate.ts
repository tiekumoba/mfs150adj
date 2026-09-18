import type { RequestHandler, Response } from "express";
import type { ZodType } from "zod";

interface Schemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

/**
 * Validates request parts with zod. Parsed values are placed on `res.locals.validated`
 * (Express 5 makes `req.query` read-only). Failures are forwarded to the error handler as a 400.
 */
export function validate(schemas: Schemas): RequestHandler {
  return (req, res, next) => {
    try {
      res.locals.validated = {
        body: schemas.body?.parse(req.body),
        query: schemas.query?.parse(req.query),
        params: schemas.params?.parse(req.params),
      };
      next();
    } catch (err) {
      next(err);
    }
  };
}

/** Typed accessor for values stored by `validate`. */
export function validated<T extends { body?: unknown; query?: unknown; params?: unknown }>(
  res: Response,
): T {
  return res.locals.validated as T;
}
