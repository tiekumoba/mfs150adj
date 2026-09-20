import { UserButton } from "@clerk/clerk-react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useCurrentUser } from "../hooks/currentUser";
import { homePath, navItems, roleLabel } from "../lib/roles";

export function AppLayout() {
  const user = useCurrentUser();

  return (
    <div className="app">
      <header className="app-header">
        <Link to={homePath[user.role]} className="brand">
          Awards Adjudication
        </Link>
        <div className="user-info">
          <span className="muted">
            {user.display_name} · {roleLabel[user.role]}
          </span>
          <UserButton />
        </div>
      </header>
      <div className="app-body">
        <nav className="sidebar" aria-label="Main">
          {navItems[user.role].map((item) => (
            <NavLink key={item.to} to={item.to} end>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
