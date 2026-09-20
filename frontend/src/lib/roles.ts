import type { Role } from "../types";

/** Where each role lands, and what its sidebar offers. Only pages that exist are listed. */
export const homePath: Record<Role, string> = {
  admin: "/admin",
  adjudicator: "/adjudicator",
};

export const roleLabel: Record<Role, string> = {
  admin: "Administrator",
  adjudicator: "Adjudicator",
};

export const navItems: Record<Role, { to: string; label: string }[]> = {
  admin: [{ to: "/admin", label: "Dashboard" }],
  adjudicator: [{ to: "/adjudicator", label: "Dashboard" }],
};
