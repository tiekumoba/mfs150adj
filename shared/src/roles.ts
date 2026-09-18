/** Application roles. Mirrors the rows seeded into the `roles` table. */
export const ROLES = ["ADMIN", "ADJUDICATOR"] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}
