import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@clerk/react";
import type { MeResponse, Role } from "@awards/shared";
import { ApiError, apiFetch } from "@/lib/api";
import { NoAccess } from "@/components/NoAccess";

/**
 * Clerk proves who the user is; the backend (`GET /api/me`) tells us whether they are invited
 * and which role they have. Route guards here are for UX only. The API enforces access itself.
 */
type Me = MeResponse["data"];

export type AuthState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "no-access" }
  | { status: "error"; message: string }
  | { status: "ready"; user: Me };

type Result = { userId: string } & (
  | { kind: "ready"; user: Me }
  | { kind: "no-access" }
  | { kind: "error"; message: string }
);

const AuthContext = createContext<AuthState>({ status: "loading" });

export const useAuthState = () => useContext(AuthContext);

export const roleHome = (role: Role) => (role === "ADMIN" ? "/admin" : "/adjudicator");

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) return;
    let cancelled = false;
    (async () => {
      let next: Result;
      try {
        const { data } = await apiFetch<MeResponse>("/api/me", await getToken());
        next = { userId, kind: "ready", user: data };
      } catch (err) {
        next =
          err instanceof ApiError && err.status === 403
            ? { userId, kind: "no-access" }
            : { userId, kind: "error", message: err instanceof Error ? err.message : "Request failed" };
      }
      if (!cancelled) setResult(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, userId, getToken]);

  let state: AuthState;
  if (!isLoaded) state = { status: "loading" };
  else if (!isSignedIn) state = { status: "signed-out" };
  else if (result?.userId !== userId) state = { status: "loading" };
  else if (result.kind === "ready") state = { status: "ready", user: result.user };
  else if (result.kind === "no-access") state = { status: "no-access" };
  else state = { status: "error", message: result.message };

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function LoadingScreen() {
  return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>;
}

export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const auth = useAuthState();
  switch (auth.status) {
    case "loading":
      return <LoadingScreen />;
    case "signed-out":
      return <Navigate to="/login" replace />;
    case "no-access":
      return <NoAccess />;
    case "error":
      return <NoAccess message={`Could not reach the server: ${auth.message}`} />;
    case "ready":
      return roles.includes(auth.user.role) ? <>{children}</> : <Navigate to={roleHome(auth.user.role)} replace />;
  }
}
