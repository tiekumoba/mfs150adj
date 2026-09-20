import { useEffect, useState } from "react";
import { useApi } from "./useApi";

interface ApiData<T> {
  data: T | null;
  error: string | null;
}

/** GET a path once on mount. `error` is a message ready to show. */
export function useApiData<T>(path: string): ApiData<T> {
  const api = useApi();
  const [state, setState] = useState<ApiData<T>>({ data: null, error: null });

  useEffect(() => {
    let cancelled = false;
    api<T>(path)
      .then((data) => !cancelled && setState({ data, error: null }))
      .catch((err: Error) => !cancelled && setState({ data: null, error: err.message }));
    return () => {
      cancelled = true;
    };
  }, [api, path]);

  return state;
}
