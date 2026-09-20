import { Navigate } from "react-router-dom";
import { useCurrentUser } from "../hooks/currentUser";
import { homePath } from "../lib/roles";

/** `/` and `/dashboard` send each user to the dashboard for their role. */
export function RoleHomePage() {
  const user = useCurrentUser();
  return <Navigate to={homePath[user.role]} replace />;
}
