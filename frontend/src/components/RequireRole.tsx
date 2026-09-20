import { Navigate, Outlet } from "react-router-dom";
import { useCurrentUser } from "../hooks/currentUser";
import type { Role } from "../types";

/** Renders its child routes only for users with this role; everyone else sees Access denied. */
export function RequireRole({ role }: { role: Role }) {
  const user = useCurrentUser();
  if (user.role !== role) return <Navigate to="/access-denied" replace />;
  return <Outlet />;
}
