import { SignOutButton } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { ApiError } from "../lib/api";
import { useApi } from "../hooks/useApi";
import { CurrentUserContext } from "../hooks/currentUser";
import type { User } from "../types";
import { AccessDenied } from "./AccessDenied";

type State =
  | { kind: "loading" }
  | { kind: "ready"; user: User }
  | { kind: "denied"; message: string }
  | { kind: "error"; message: string };

/**
 * A Clerk sign-in is not enough: the backend must also have an active account for the user.
 * Loads that account once and only renders the app when it exists.
 */
export function CurrentUserGate() {
  const api = useApi();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    api<User>("/me")
      .then((user) => !cancelled && setState({ kind: "ready", user }))
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Something went wrong.";
        setState({ kind: err instanceof ApiError && err.status === 403 ? "denied" : "error", message });
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  if (state.kind === "loading") return <p className="status">Loading…</p>;

  if (state.kind === "ready") {
    return (
      <CurrentUserContext.Provider value={state.user}>
        <Outlet />
      </CurrentUserContext.Provider>
    );
  }

  const signOut = (
    <SignOutButton>
      <button type="button">Sign out</button>
    </SignOutButton>
  );

  if (state.kind === "denied") {
    return (
      <div className="center">
        <AccessDenied message={state.message}>
          <p className="muted">If you think this is a mistake, contact an administrator.</p>
          {signOut}
        </AccessDenied>
      </div>
    );
  }

  return (
    <div className="center">
      <h1>Something went wrong</h1>
      <p>{state.message}</p>
      {signOut}
    </div>
  );
}
