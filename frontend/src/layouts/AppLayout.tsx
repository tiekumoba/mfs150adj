import { UserButton } from "@clerk/clerk-react";
import { Link, Outlet } from "react-router-dom";

export function AppLayout() {
  return (
    <div className="app">
      <header className="app-header">
        <Link to="/dashboard" className="brand">
          Awards Adjudication
        </Link>
        <UserButton />
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
