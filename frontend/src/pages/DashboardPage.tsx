import { useEffect, useState } from "react";
import { useApi } from "../hooks/useApi";

interface MeResponse {
  clerk_user_id: string;
}

export function DashboardPage() {
  const api = useApi();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<MeResponse>("/me")
      .then(setMe)
      .catch((err: Error) => setError(err.message));
  }, [api]);

  return (
    <>
      <h1>Dashboard</h1>
      <p>Placeholder — awards functionality comes later.</p>
      {/* Temporary check that the token round-trips to the backend. */}
      <p className="muted">
        {error ? `API error: ${error}` : me ? `Backend sees you as ${me.clerk_user_id}` : "Checking API…"}
      </p>
    </>
  );
}
