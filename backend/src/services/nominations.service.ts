import type {
  AuditChange,
  AuditEntryDto,
  EvidenceKind,
  NominationDetail,
  NominationDocumentDto,
  NominationListItem,
  NominationUpdate,
  Paginated,
} from "@awards/shared";
import { getPool } from "../db/pool.js";
import { AppError } from "../middleware/errors.js";
import { recordAudit, type AuditContext } from "./audit.service.js";

interface ListRow {
  id: string;
  nominee_name: string;
  nominator_name: string | null;
  category_id: string;
  category_name: string;
  status: string;
  document_count: string;
  total: string;
}

/** Escapes LIKE wildcards so user input is matched literally. */
const escapeLike = (value: string) => value.replace(/[\\%_]/g, (c) => `\\${c}`);

export async function listNominations(params: {
  categoryId?: string;
  search?: string;
  page: number;
  pageSize: number;
}): Promise<Paginated<NominationListItem>> {
  const pattern = params.search ? `%${escapeLike(params.search)}%` : null;
  const { rows } = await getPool().query<ListRow>(
    `SELECT n.id, n.nominee_name, n.nominator_name, n.category_id, c.name AS category_name, n.status,
            (SELECT count(*) FROM nomination_documents d WHERE d.nomination_id = n.id) AS document_count,
            count(*) OVER () AS total
       FROM nominations n
       JOIN categories c ON c.id = n.category_id
      WHERE ($1::uuid IS NULL OR n.category_id = $1)
        AND ($2::text IS NULL OR n.nominee_name ILIKE $2 OR n.nominator_name ILIKE $2)
      ORDER BY n.nominee_name, n.id
      LIMIT $3 OFFSET $4`,
    [params.categoryId ?? null, pattern, params.pageSize, (params.page - 1) * params.pageSize],
  );
  return {
    data: rows.map((r) => ({
      id: r.id,
      nomineeName: r.nominee_name,
      nominatorName: r.nominator_name,
      categoryId: r.category_id,
      categoryName: r.category_name,
      status: r.status,
      documentCount: Number(r.document_count),
    })),
    total: rows[0] ? Number(rows[0].total) : 0,
    page: params.page,
    pageSize: params.pageSize,
  };
}

export async function getNomination(id: string): Promise<NominationDetail | null> {
  const pool = getPool();
  const { rows } = await pool.query<{
    id: string;
    nominee_name: string;
    nominator_name: string | null;
    citation: string | null;
    category_id: string;
    category_name: string;
    status: string;
  }>(
    `SELECT n.id, n.nominee_name, n.nominator_name, n.citation, n.category_id, c.name AS category_name, n.status
       FROM nominations n JOIN categories c ON c.id = n.category_id
      WHERE n.id = $1`,
    [id],
  );
  const n = rows[0];
  if (!n) return null;

  const docs = await pool.query<{ id: string; kind: NominationDocumentDto["kind"]; url: string; file_name: string | null }>(
    `SELECT id, kind, url, file_name FROM nomination_documents WHERE nomination_id = $1 ORDER BY created_at, id`,
    [id],
  );
  const evals = await pool.query<{ count: string }>(
    `SELECT count(*) FROM evaluations e JOIN assignments a ON a.id = e.assignment_id WHERE a.nomination_id = $1`,
    [id],
  );
  return {
    id: n.id,
    nomineeName: n.nominee_name,
    nominatorName: n.nominator_name,
    citation: n.citation,
    evaluationCount: Number(evals.rows[0]!.count),
    categoryId: n.category_id,
    categoryName: n.category_name,
    status: n.status,
    documents: docs.rows.map((d) => ({ id: d.id, kind: d.kind, url: d.url, fileName: d.file_name })),
  };
}

const blankToNull = (v: string | null | undefined) => (v === undefined ? undefined : v?.trim() ? v.trim() : null);

/**
 * Updates a nomination. Only fields that actually change are written, and each change is
 * recorded (field, old value, new value) in the audit log in the same transaction.
 */
export async function updateNomination(
  id: string,
  input: NominationUpdate,
  reason: string,
  ctx: AuditContext,
): Promise<NominationDetail> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query<{
      nominee_name: string;
      nominator_name: string | null;
      citation: string | null;
      category_id: string;
      category_name: string;
    }>(
      `SELECT n.nominee_name, n.nominator_name, n.citation, n.category_id, c.name AS category_name
         FROM nominations n JOIN categories c ON c.id = n.category_id
        WHERE n.id = $1 FOR UPDATE OF n`,
      [id],
    );
    const current = rows[0];
    if (!current) throw new AppError(404, "NOT_FOUND", "Nomination not found");

    const changes: AuditChange[] = [];
    const sets: string[] = [];
    const values: unknown[] = [id];
    const set = (column: string, value: unknown) => {
      values.push(value);
      sets.push(`${column} = $${values.length}`);
    };

    if (input.nomineeName !== undefined && input.nomineeName !== current.nominee_name) {
      changes.push({ field: "nomineeName", from: current.nominee_name, to: input.nomineeName });
      set("nominee_name", input.nomineeName);
    }
    const nominator = blankToNull(input.nominatorName);
    if (nominator !== undefined && nominator !== current.nominator_name) {
      changes.push({ field: "nominatorName", from: current.nominator_name, to: nominator });
      set("nominator_name", nominator);
    }
    const citation = blankToNull(input.citation);
    if (citation !== undefined && citation !== current.citation) {
      changes.push({ field: "citation", from: current.citation, to: citation });
      set("citation", citation);
    }
    if (input.categoryId !== undefined && input.categoryId !== current.category_id) {
      const cat = await client.query<{ name: string }>("SELECT name FROM categories WHERE id = $1", [input.categoryId]);
      if (!cat.rows[0]) throw new AppError(400, "CATEGORY_NOT_FOUND", "Category does not exist");
      changes.push({ field: "category", from: current.category_name, to: cat.rows[0].name });
      set("category_id", input.categoryId);
    }

    if (changes.length > 0) {
      await client.query(`UPDATE nominations SET ${sets.join(", ")}, updated_at = now() WHERE id = $1`, values);
      await recordAudit(client, ctx, {
        action: "nomination.updated",
        entityType: "nomination",
        entityId: id,
        reason,
        changes,
        metadata: { nomineeName: input.nomineeName ?? current.nominee_name },
      });
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  return (await getNomination(id))!;
}

export async function addDocument(
  nominationId: string,
  input: { kind: EvidenceKind; url: string; fileName?: string | null },
  reason: string,
  ctx: AuditContext,
): Promise<NominationDetail> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const exists = await client.query("SELECT 1 FROM nominations WHERE id = $1 FOR UPDATE", [nominationId]);
    if (!exists.rowCount) throw new AppError(404, "NOT_FOUND", "Nomination not found");
    await client.query(
      `INSERT INTO nomination_documents (nomination_id, kind, url, file_name) VALUES ($1, $2, $3, $4)`,
      [nominationId, input.kind, input.url, blankToNull(input.fileName) ?? null],
    );
    await recordAudit(client, ctx, {
      action: "nomination.evidence_added",
      entityType: "nomination",
      entityId: nominationId,
      reason,
      changes: [{ field: "evidence", from: null, to: input.url }],
    });
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    if ((err as { code?: string }).code === "23505") {
      throw new AppError(409, "EVIDENCE_EXISTS", "This link is already attached to the nomination");
    }
    throw err;
  } finally {
    client.release();
  }
  return (await getNomination(nominationId))!;
}

export async function removeDocument(
  nominationId: string,
  documentId: string,
  reason: string,
  ctx: AuditContext,
): Promise<NominationDetail> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query<{ url: string }>(
      `DELETE FROM nomination_documents WHERE id = $1 AND nomination_id = $2 RETURNING url`,
      [documentId, nominationId],
    );
    if (!rows[0]) throw new AppError(404, "NOT_FOUND", "Evidence not found");
    await recordAudit(client, ctx, {
      action: "nomination.evidence_removed",
      entityType: "nomination",
      entityId: nominationId,
      reason,
      changes: [{ field: "evidence", from: rows[0].url, to: null }],
    });
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  return (await getNomination(nominationId))!;
}

export async function getNominationHistory(nominationId: string): Promise<AuditEntryDto[]> {
  const { rows } = await getPool().query<{
    id: string;
    action: string;
    actor_name: string | null;
    actor_email: string | null;
    source: AuditEntryDto["source"];
    ip_address: string | null;
    created_at: Date;
    reason: string | null;
    changes: AuditChange[] | null;
  }>(
    `SELECT a.id, a.action, u.full_name AS actor_name, a.actor_email, a.source, a.ip_address, a.created_at, a.reason, a.changes
       FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_user_id
      WHERE a.entity_type = 'nomination' AND a.entity_id = $1
      ORDER BY a.created_at DESC, a.id DESC`,
    [nominationId],
  );
  return rows.map((r) => ({
    id: r.id,
    action: r.action,
    actorName: r.actor_name,
    actorEmail: r.actor_email,
    source: r.source,
    ipAddress: r.ip_address,
    createdAt: r.created_at.toISOString(),
    reason: r.reason,
    changes: r.changes ?? [],
  }));
}
