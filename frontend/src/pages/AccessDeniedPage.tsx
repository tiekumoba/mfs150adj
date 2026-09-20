import { Link } from "react-router-dom";
import { AccessDenied } from "../components/AccessDenied";
import { useCurrentUser } from "../hooks/currentUser";
import { homePath } from "../lib/roles";

/** Shown when a signed-in user opens a page that belongs to another role. */
export function AccessDeniedPage() {
  const user = useCurrentUser();
  return (
    <AccessDenied message="You don't have permission to view that page.">
      <Link to={homePath[user.role]}>Back to your dashboard</Link>
    </AccessDenied>
  );
}
