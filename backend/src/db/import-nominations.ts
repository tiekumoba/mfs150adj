import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { closePool, getPool } from "./pool.js";

/**
 * Imports nominations (with supporting-evidence links) from an awards.json file.
 * Creates any missing categories. Safe to re-run: nominations are matched on `source_id`.
 *
 * Usage: npm run db:import -- backend/data/awards.json
 * The data file contains personal information. Keep it in the gitignored backend/data/ folder.
 */
const evidenceSchema = z.object({
  kind: z.enum(["image", "document", "video", "external_link"]),
  url: z.string().min(1),
  filename: z.string().nullish(),
});

const recordSchema = z.object({
  id: z.uuid(),
  nominee_name: z.string().trim().min(1),
  award_category: z.string().trim().min(1),
  justification: z.string().nullish(),
  nominator_name: z.string().nullish(),
  supporting_evidence: z.array(evidenceSchema).default([]),
});

async function importNominations(): Promise<void> {
  const file = process.argv[2];
  if (!file) throw new Error("Usage: npm run db:import -- path/to/awards.json");

  // npm runs workspace scripts from backend/, so also try the path relative to the repo root.
  const candidates = [path.resolve(file), path.resolve(process.env.INIT_CWD ?? ".", file)];
  let raw: string | undefined;
  for (const candidate of candidates) {
    try {
      raw = await readFile(candidate, "utf8");
      break;
    } catch {
      /* try next */
    }
  }
  if (raw === undefined) throw new Error(`Cannot read ${file}`);

  const records = z.array(recordSchema).parse(JSON.parse(raw));
  const client = await getPool().connect();
  const counts = { nominations: 0, skipped: 0, documents: 0 };

  try {
    await client.query("BEGIN");

    const categoryIds = new Map<string, string>();
    for (const name of new Set(records.map((r) => r.award_category))) {
      const { rows } = await client.query<{ id: string }>(
        `INSERT INTO categories (name) VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [name],
      );
      categoryIds.set(name, rows[0]!.id);
    }

    for (const r of records) {
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO nominations (source_id, category_id, nominee_name, nominator_name, citation)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (source_id) DO NOTHING
         RETURNING id`,
        [r.id, categoryIds.get(r.award_category), r.nominee_name, r.nominator_name ?? null, r.justification ?? null],
      );
      let nominationId = inserted.rows[0]?.id;
      if (nominationId) {
        counts.nominations++;
      } else {
        counts.skipped++;
        const existing = await client.query<{ id: string }>(
          "SELECT id FROM nominations WHERE source_id = $1",
          [r.id],
        );
        nominationId = existing.rows[0]!.id;
      }

      for (const e of r.supporting_evidence) {
        const doc = await client.query(
          `INSERT INTO nomination_documents (nomination_id, kind, url, file_name)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (nomination_id, url) DO NOTHING`,
          [nominationId, e.kind, e.url, e.filename ?? null],
        );
        counts.documents += doc.rowCount ?? 0;
      }
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  const { rows } = await getPool().query<{ categories: string; nominations: string; documents: string }>(
    `SELECT (SELECT count(*) FROM categories) AS categories,
            (SELECT count(*) FROM nominations) AS nominations,
            (SELECT count(*) FROM nomination_documents) AS documents`,
  );
  console.log(
    `Read ${records.length} records. New nominations: ${counts.nominations}, already present: ${counts.skipped}, new documents: ${counts.documents}.`,
  );
  console.log(`Database totals: ${rows[0]!.categories} categories, ${rows[0]!.nominations} nominations, ${rows[0]!.documents} documents.`);
}

importNominations()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(closePool);
