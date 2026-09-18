import { useState } from "react";
import { Outlet } from "react-router-dom";
import type { NavItem } from "@/lib/nav";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export function AppShell({ nav, roleLabel }: { nav: NavItem[]; roleLabel: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="min-h-screen">
      <Sidebar items={nav} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="lg:pl-64">
        <Header roleLabel={roleLabel} onMenuClick={() => setMenuOpen(true)} />
        <main className="mx-auto max-w-6xl p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
