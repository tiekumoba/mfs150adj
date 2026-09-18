import type { ReactNode } from "react";
import type { Role } from "@awards/shared";

/**
 * Authentication / RBAC scaffolding. Clerk is NOT wired up yet.
 *
 * Once Clerk is added, `useCurrentRole` should read the role from the Clerk session
 * (e.g. public metadata) and `RequireRole` should redirect unauthenticated users to /login.
 * Until then every route is open — this is a UI preview, not a security boundary.
 * The backend must enforce roles independently (see backend/src/middleware/auth.ts).
 */
export function useCurrentRole(): Role | null {
  return null; // TODO(clerk): return the signed-in user's role
}

export function RequireRole({ children }: { roles: Role[]; children: ReactNode }) {
  // TODO(clerk): if (!role) redirect to /login; if (!roles.includes(role)) show forbidden.
  return <>{children}</>;
}
