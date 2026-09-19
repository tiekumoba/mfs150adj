import { Navigate } from "react-router-dom";
import { SignIn } from "@clerk/react";
import { NoAccess } from "@/components/NoAccess";
import { LoadingScreen, roleHome, useAuthState } from "@/lib/auth";

export default function Login() {
  const auth = useAuthState();
  if (auth.status === "loading") return <LoadingScreen />;
  if (auth.status === "ready") return <Navigate to={roleHome(auth.user.role)} replace />;
  if (auth.status === "no-access") return <NoAccess />;
  if (auth.status === "error") return <NoAccess message={`Could not reach the server: ${auth.message}`} />;
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <SignIn routing="path" path="/login" />
    </div>
  );
}
