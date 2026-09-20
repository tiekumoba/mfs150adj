import { useApiData } from "../hooks/useApiData";
import type { Page, User } from "../types";

export function AdminDashboardPage() {
  const { data, error } = useApiData<Page<User>>("/users?limit=100");

  return (
    <>
      <h1>Admin dashboard</h1>
      <h2>Users</h2>
      {error && <p className="error">{error}</p>}
      {!error && !data && <p className="muted">Loading…</p>}
      {data && (
        <>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((u) => (
                <tr key={u.id}>
                  <td>{u.display_name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.total > data.items.length && (
            <p className="muted">
              Showing {data.items.length} of {data.total} users.
            </p>
          )}
        </>
      )}
    </>
  );
}
