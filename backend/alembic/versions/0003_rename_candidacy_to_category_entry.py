"""rename candidacies to category_entries

Revision ID: 0003
Revises: 0002
Create Date: 2026-09-19
"""
from typing import Sequence, Union

from alembic import op

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Columns that referenced the table: (table, old name, new name).
COLUMNS = [
    ("nominations", "candidacy_id", "category_entry_id"),
    ("evaluations", "candidacy_id", "category_entry_id"),
    ("adjudicator_conflicts", "candidacy_id", "category_entry_id"),
    ("category_result_entries", "candidacy_id", "category_entry_id"),
]

# Constraints whose generated names contained the old name: (table, old, new).
CONSTRAINTS = [
    ("category_entries", "pk_candidacies", "pk_category_entries"),
    ("category_entries", "uq_candidacies_category_id_nominee_id",
     "uq_category_entries_category_id_nominee_id"),
    ("category_entries", "ck_candidacies_status", "ck_category_entries_status"),
    ("category_entries", "fk_candidacies_category_id_categories",
     "fk_category_entries_category_id_categories"),
    ("category_entries", "fk_candidacies_nominee_id_nominees",
     "fk_category_entries_nominee_id_nominees"),
    ("nominations", "fk_nominations_candidacy_id_candidacies",
     "fk_nominations_category_entry_id_category_entries"),
    ("evaluations", "uq_evaluations_assignment_id_candidacy_id",
     "uq_evaluations_assignment_id_category_entry_id"),
    ("evaluations", "fk_evaluations_candidacy_id_candidacies",
     "fk_evaluations_category_entry_id_category_entries"),
    ("adjudicator_conflicts", "uq_adjudicator_conflicts_assignment_id_candidacy_id",
     "uq_adjudicator_conflicts_assignment_id_category_entry_id"),
    ("adjudicator_conflicts", "fk_adjudicator_conflicts_candidacy_id_candidacies",
     "fk_adjudicator_conflicts_category_entry_id_category_entries"),
    ("category_result_entries", "uq_category_result_entries_result_id_candidacy_id",
     "uq_category_result_entries_result_id_category_entry_id"),
    ("category_result_entries", "fk_category_result_entries_candidacy_id_candidacies",
     "fk_category_result_entries_category_entry_id_category_entries"),
]  # fmt: skip

# PostgreSQL 18 stores NOT NULL as named constraints, and a table or column rename does not
# rename them. This renames whichever exist (none on older versions).
_RENAME_NOT_NULL = """
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT conrelid::regclass::text AS tbl, conname FROM pg_constraint
    WHERE contype = 'n' AND connamespace = 'public'::regnamespace
      AND position('{find}' in conname) > 0
  LOOP
    EXECUTE format('ALTER TABLE %s RENAME CONSTRAINT %I TO %I', r.tbl, r.conname,
      replace(replace(r.conname, '{a_old}', '{a_new}'), '{b_old}', '{b_new}'));
  END LOOP;
END $$;
"""


def upgrade() -> None:
    op.rename_table("candidacies", "category_entries")
    for table, old, new in COLUMNS:
        op.alter_column(table, old, new_column_name=new)
    for table, old, new in CONSTRAINTS:
        op.execute(f'ALTER TABLE {table} RENAME CONSTRAINT "{old}" TO "{new}"')
    op.execute(_RENAME_NOT_NULL.format(
        find="candidac", a_old="candidacies", a_new="category_entries",
        b_old="candidacy", b_new="category_entry",
    ))  # fmt: skip


def downgrade() -> None:
    op.execute(_RENAME_NOT_NULL.format(
        find="category_entr", a_old="category_entries", a_new="candidacies",
        b_old="category_entry", b_new="candidacy",
    ))  # fmt: skip
    for table, old, new in CONSTRAINTS:
        op.execute(f'ALTER TABLE {table} RENAME CONSTRAINT "{new}" TO "{old}"')
    for table, old, new in COLUMNS:
        op.alter_column(table, new, new_column_name=old)
    op.rename_table("category_entries", "candidacies")
