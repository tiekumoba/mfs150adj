import type { Request } from "express";
import type { PoolClient } from "pg";
import type { AuditChange } from "@awards/shared";

/** Who is making a change and where it came from. Build with `auditContextFrom(req)`. */
export interface AuditContext {
  actorUserId: string;
  actorEmail: string;
  source: "web" | "import" | "script";
  ipAddress: string | null;
  userAgent: string | null;
}

export function auditContextFrom(req: Request): AuditContext {
  const user = req.auth!;
  return {
    actorUserId: user.id,
    actorEmail: user.email,
    source: "web",
    ipAddress: req.ip ?? null,
    userAgent: req.get("user-agent")?.slice(0, 300) ?? null,
  };
}

/** Appends an entry. Call inside the same transaction as the change it describes. */
export async function recordAudit(
  client: PoolClient,
  ctx: AuditContext,
  entry: {
    action: string;
    entityType: string;
    entityId: string;
    changes?: AuditChange[];
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  await client.query(
    `INSERT INTO audit_logs
       (actor_user_id, actor_email, source, ip_address, user_agent, action, entity_type, entity_id, changes, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      ctx.actorUserId,
      ctx.actorEmail,
      ctx.source,
      ctx.ipAddress,
      ctx.userAgent,
      entry.action,
      entry.entityType,
      entry.entityId,
      entry.changes ? JSON.stringify(entry.changes) : null,
      JSON.stringify(entry.metadata ?? {}),
    ],
  );
}
