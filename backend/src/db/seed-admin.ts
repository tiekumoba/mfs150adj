import { closePool, getPool } from "./pool.js";

/**
 * Creates (or promotes) an ADMIN user so the first person can sign in.
 * Usage: npm run db:seed-admin -- you@example.org "Your Name"
 * The email must match the email address the person signs in to Clerk with.
 */
async function seedAdmin(): Promise<void> {
  const [email, ...nameParts] = process.argv.slice(2);
  if (!email || !email.includes("@")) {
    throw new Error('Usage: npm run db:seed-admin -- you@example.org "Your Name"');
  }
  const fullName = nameParts.join(" ").trim() || email;

  const { rows } = await getPool().query<{ id: string }>(
    `INSERT INTO users (email, full_name, role_id)
     VALUES (lower($1), $2, (SELECT id FROM roles WHERE name = 'ADMIN'))
     ON CONFLICT (email) DO UPDATE
       SET role_id = EXCLUDED.role_id, is_active = true, updated_at = now()
     RETURNING id`,
    [email, fullName],
  );
  console.log(`Admin ready: ${email.toLowerCase()} (${rows[0]?.id})`);
}

seedAdmin()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(closePool);
