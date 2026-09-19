import type { CategoryDto } from "@awards/shared";
import { getPool } from "../db/pool.js";

interface CategoryRow {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  nomination_count: string;
}

export async function listCategories(filter: { active?: boolean }): Promise<CategoryDto[]> {
  const { rows } = await getPool().query<CategoryRow>(
    `SELECT c.id, c.name, c.description, c.is_active, count(n.id) AS nomination_count
       FROM categories c
       LEFT JOIN nominations n ON n.category_id = c.id
      WHERE ($1::boolean IS NULL OR c.is_active = $1)
      GROUP BY c.id
      ORDER BY c.name`,
    [filter.active ?? null],
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    isActive: r.is_active,
    nominationCount: Number(r.nomination_count),
  }));
}
