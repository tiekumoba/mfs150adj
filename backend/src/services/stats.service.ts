import type { AdminStats } from "@awards/shared";
import { getPool } from "../db/pool.js";

export async function getAdminStats(): Promise<AdminStats> {
  const { rows } = await getPool().query<Record<keyof AdminStats, string>>(
    `SELECT
       (SELECT count(*) FROM nominations) AS "totalNominations",
       (SELECT count(*) FROM users u JOIN roles r ON r.id = u.role_id
         WHERE r.name = 'ADJUDICATOR' AND u.is_active) AS "totalAdjudicators",
       (SELECT count(*) FROM assignments WHERE status <> 'COMPLETED') AS "pendingAssignments",
       (SELECT count(*) FROM evaluations WHERE status = 'SUBMITTED') AS "completedEvaluations"`,
  );
  const r = rows[0]!;
  return {
    totalNominations: Number(r.totalNominations),
    totalAdjudicators: Number(r.totalAdjudicators),
    pendingAssignments: Number(r.pendingAssignments),
    completedEvaluations: Number(r.completedEvaluations),
  };
}
