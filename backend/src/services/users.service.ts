import type { Role } from "@awards/shared";
import { getPool } from "../db/pool.js";

export interface AppUser {
  id: string;
  clerkUserId: string;
  email: string;
  fullName: string;
  role: Role;
}

interface UserRow {
  id: string;
  clerk_user_id: string;
  email: string;
  full_name: string;
  role: Role;
}

const toAppUser = (r: UserRow): AppUser => ({
  id: r.id,
  clerkUserId: r.clerk_user_id,
  email: r.email,
  fullName: r.full_name,
  role: r.role,
});

export async function findActiveByClerkId(clerkUserId: string): Promise<AppUser | null> {
  const { rows } = await getPool().query<UserRow>(
    `SELECT u.id, u.clerk_user_id, u.email, u.full_name, r.name AS role
       FROM users u JOIN roles r ON r.id = u.role_id
      WHERE u.clerk_user_id = $1 AND u.is_active`,
    [clerkUserId],
  );
  return rows[0] ? toAppUser(rows[0]) : null;
}

/**
 * First sign-in: links a Clerk identity to the pre-created (invited) user with the same email.
 * Only links rows that are active and not yet linked to any Clerk account.
 */
export async function linkClerkUserByEmail(
  email: string,
  clerkUserId: string,
): Promise<AppUser | null> {
  const { rows } = await getPool().query<UserRow>(
    `WITH linked AS (
       UPDATE users SET clerk_user_id = $2, updated_at = now()
        WHERE lower(email) = lower($1) AND is_active AND clerk_user_id IS NULL
        RETURNING id, clerk_user_id, email, full_name, role_id
     )
     SELECT l.id, l.clerk_user_id, l.email, l.full_name, r.name AS role
       FROM linked l JOIN roles r ON r.id = l.role_id`,
    [email, clerkUserId],
  );
  return rows[0] ? toAppUser(rows[0]) : null;
}
