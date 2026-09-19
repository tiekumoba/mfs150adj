import { useEffect, useState } from "react";
import { useAuth } from "@clerk/react";
import { apiFetch } from "@/lib/api";

interface Result<T> {
  key: string;
  data?: T;
  error?: string;
}

/**
 * GET `path` from the API with the Clerk token. Pass null to skip.
 * Re-fetches when `path` or `reloadToken` changes (bump the token after a change to refresh).
 */
export function useApiQuery<T>(path: string | null, reloadToken = 0) {
  const { getToken } = useAuth();
  const [result, setResult] = useState<Result<T> | null>(null);

  useEffect(() => {
    if (!path) return;
    const key = `${path}#${reloadToken}`;
    let cancelled = false;
    (async () => {
      let next: Result<T>;
      try {
        next = { key, data: await apiFetch<T>(path, await getToken()) };
      } catch (err) {
        next = { key, error: err instanceof Error ? err.message : "Request failed" };
      }
      if (!cancelled) setResult(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [path, reloadToken, getToken]);

  const current = path !== null && result?.key === `${path}#${reloadToken}` ? result : null;
  return { data: current?.data, error: current?.error, loading: path !== null && current === null };
}
