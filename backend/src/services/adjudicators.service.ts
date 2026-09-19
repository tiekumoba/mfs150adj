import type { AdjudicatorDto } from "@awards/shared";
import { getPool } from "../db/pool.js";
import { AppError } from "../middleware/errors.js";
import { recordAudit, type AuditContext } from "./audit.service.js";

interface Row {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  has_signed_in: boolean;
  assignment_count: string;
  created_at: Date;
}

const toDto = (r: Row): AdjudicatorDto => ({
  id: r.id,
  email: r.email,
  fullName: r.full_name,
  isActive: r.is_active,
  hasSignedIn: r.has_signed_in,
  assignmentCount: Number(r.assignment_count),
  createdAt: r.created_at.toISOString(),
});

const SELECT = `
  SELECT u.id, u.email, u.full_name, u.is_active, u.created_at,
         (u.clerk_user_id IS NOT NULL) AS has_signed_in,
         (SELECT count(*) FROM assignments a WHERE a.adjudicator_id = u.id) AS assignment_count
    FROM users u JOIN roles r ON r.id = u.role_id
   WHERE r.name = 'ADJUDICATOR'`;

export async function listAdjudicators(): Promise<AdjudicatorDto[]> {
  const { rows } = await getPool().query<Row>(`${SELECT} ORDER BY u.full_name, u.email`);
  return rows.map(toDto);
}

export async function createAdjudicator(
  input: { email: string; fullName: string },
  reason: string,
  ctx: AuditContext,
): Promise<AdjudicatorDto> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO users (email, full_name, role_id)
       VALUES (lower($1), $2, (SELECT id FROM roles WHERE name = 'ADJUDICATOR'))
       RETURNING id`,
      [input.email, input.fullName],
    );
    const id = rows[0]!.id;
    await recordAudit(client, ctx, {
      action: "adjudicator.created",
      entityType: "user",
      entityId: id,
      reason,
      metadata: { email: input.email.toLowerCase() },
      changes: [{ field: "email", from: null, to: input.email.toLowerCase() }],
    });
    await client.query("COMMIT");
    const created = await getPool().query<Row>(`${SELECT} AND u.id = $1`, [id]);
    return toDto(created.rows[0]!);
  } catch (err) {
    await client.query("ROLLBACK");
    if ((err as { code?: string }).code === "23505") {
      throw new AppError(409, "EMAIL_EXISTS", "A user with this email already exists");
    }
    throw err;
  } finally {
    client.release();
  }
}

export async function setAdjudicatorActive(
  id: string,
  isActive: boolean,
  reason: string,
  ctx: AuditContext,
): Promise<AdjudicatorDto> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    // Only adjudicator rows can be changed here, so an admin can never lock out an admin.
    const { rowCount } = await client.query(
      `UPDATE users SET is_active = $2, updated_at = now()
        WHERE id = $1 AND role_id = (SELECT id FROM roles WHERE name = 'ADJUDICATOR')`,
      [id, isActive],
    );
    if (!rowCount) throw new AppError(404, "NOT_FOUND", "Adjudicator not found");
    await recordAudit(client, ctx, {
      action: isActive ? "adjudicator.reactivated" : "adjudicator.deactivated",
      entityType: "user",
      entityId: id,
      reason,
      changes: [{ field: "isActive", from: String(!isActive), to: String(isActive) }],
    });
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  const { rows } = await getPool().query<Row>(`${SELECT} AND u.id = $1`, [id]);
  return toDto(rows[0]!);
}
