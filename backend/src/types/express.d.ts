import type { Role } from "@awards/shared";

declare global {
  namespace Express {
    interface Request {
      /** Populated by `requireAuth` once Clerk is integrated. */
      auth?: {
        userId: string;
        clerkUserId: string;
        role: Role;
      };
    }
  }
}

export {};
