import { useAuth } from "@clerk/clerk-react";
import { useCallback } from "react";
import { apiFetch } from "../lib/api";

/** API client that attaches the current Clerk session token to each request. */
export function useApi() {
  const { getToken } = useAuth();

  return useCallback(
    async <T,>(path: string, init?: RequestInit): Promise<T> => {
      const token = await getToken();
      return apiFetch<T>(path, token, init);
    },
    [getToken],
  );
}
