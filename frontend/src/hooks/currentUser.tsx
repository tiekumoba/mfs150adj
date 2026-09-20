import { createContext, useContext } from "react";
import type { User } from "../types";

export const CurrentUserContext = createContext<User | null>(null);

/** The signed-in user's application account. Only usable below CurrentUserGate. */
export function useCurrentUser(): User {
  const user = useContext(CurrentUserContext);
  if (!user) throw new Error("useCurrentUser must be used inside CurrentUserGate");
  return user;
}
