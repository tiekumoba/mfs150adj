import type { AppUser } from "../services/users.service.js";

declare global {
  namespace Express {
    interface Request {
      /** Populated by `requireAuth`. */
      auth?: AppUser;
    }
  }
}

export {};
