import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="center">
      <h1>404</h1>
      <p>That page doesn't exist.</p>
      <Link to="/dashboard">Back to dashboard</Link>
    </div>
  );
}
