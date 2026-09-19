import { useEffect, useState } from "react";
import { useAuth } from "@clerk/react";
import { apiFetch } from "@/lib/api";

interface Result<T> {
  path: string;
  data?: T;
  error?: string;
}

/** GET `path` from the API with the Clerk token. Pass null to skip. Re-fetches when `path` changes. */
export function useApiQuery<T>(path: string | null) {
  const { getToken } = useAuth();
  const [result, setResult] = useState<Result<T> | null>(null);

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    (async () => {
      let next: Result<T>;
      try {
        next = { path, data: await apiFetch<T>(path, await getToken()) };
      } catch (err) {
        next = { path, error: err instanceof Error ? err.message : "Request failed" };
      }
      if (!cancelled) setResult(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [path, getToken]);

  const current = result?.path === path ? result : null;
  return { data: current?.data, error: current?.error, loading: path !== null && current === null };
}
