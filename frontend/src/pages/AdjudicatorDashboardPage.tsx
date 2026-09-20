import { useApiData } from "../hooks/useApiData";
import type { Assignment, Page } from "../types";

export function AdjudicatorDashboardPage() {
  const { data, error } = useApiData<Page<Assignment>>("/me/assignments?limit=100");

  return (
    <>
      <h1>Adjudicator dashboard</h1>
      <h2>Your categories</h2>
      {error && <p className="error">{error}</p>}
      {!error && !data && <p className="muted">Loading…</p>}
      {data && data.items.length === 0 && (
        <p className="muted">You have not been assigned to any categories yet.</p>
      )}
      {data && data.items.length > 0 && (
        <ul className="plain">
          {data.items.map((a) => (
            <li key={a.id}>
              <strong>{a.category.name}</strong>
              <span className="muted"> · {a.category.group_name}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
