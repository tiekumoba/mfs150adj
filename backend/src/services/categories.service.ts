import type { CategoryDto } from "@awards/shared";
import { getPool } from "../db/pool.js";

interface CategoryRow {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

export async function listCategories(filter: { active?: boolean }): Promise<CategoryDto[]> {
  const { rows } = await getPool().query<CategoryRow>(
    `SELECT id, name, description, is_active
       FROM categories
      WHERE ($1::boolean IS NULL OR is_active = $1)
      ORDER BY name`,
    [filter.active ?? null],
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    isActive: r.is_active,
  }));
}
