import type { PoolClient } from "pg";

/** Records who did what. Call inside the same transaction as the change it describes. */
export async function recordAudit(
  client: PoolClient,
  entry: {
    actorUserId: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  await client.query(
    `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
     VALUES ($1, $2, $3, $4, $5)`,
    [entry.actorUserId, entry.action, entry.entityType, entry.entityId, JSON.stringify(entry.metadata ?? {})],
  );
}
