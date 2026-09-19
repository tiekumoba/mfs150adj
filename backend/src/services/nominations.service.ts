import type { NominationDetail, NominationDocumentDto, NominationListItem, Paginated } from "@awards/shared";
import { getPool } from "../db/pool.js";

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
  return {
    id: n.id,
    nomineeName: n.nominee_name,
    nominatorName: n.nominator_name,
    citation: n.citation,
    categoryId: n.category_id,
    categoryName: n.category_name,
    status: n.status,
    documents: docs.rows.map((d) => ({ id: d.id, kind: d.kind, url: d.url, fileName: d.file_name })),
  };
}
