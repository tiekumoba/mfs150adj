import { useAuth } from "@clerk/clerk-react";
import { Navigate, Outlet } from "react-router-dom";

export function ProtectedRoute() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return <p className="status">Loading…</p>;
  if (!isSignedIn) return <Navigate to="/sign-in" replace />;
  return <Outlet />;
}
