import json
from decimal import Decimal
from pathlib import Path

from sqlalchemy import ForeignKeyConstraint, Numeric, SmallInteger

from app.db.base import Base
from app.db.seed import SEED_FILE, _check_weights
import app.models  # noqa: F401  (registers models on Base.metadata)

TABLES = {
    "awards", "categories", "eligibility_criteria", "achievement_criteria", "tie_break_rules",
    "nominees", "category_entries", "nominations", "nomination_evidence",
    "app_users", "adjudicator_assignments",
    "evaluations", "evaluation_eligibility_checks", "evaluation_scores", "adjudicator_conflicts",
    "category_results", "category_result_entries",
    "audit_events", "audit_event_changes",
}  # fmt: skip


def test_schema_has_exactly_the_documented_tables() -> None:
    assert set(Base.metadata.tables) == TABLES


def test_primary_keys_are_uuids_generated_by_the_database() -> None:
    for table in Base.metadata.tables.values():
        (pk,) = table.primary_key.columns
        assert pk.type.__class__.__name__ == "UUID", table.name
        assert "gen_random_uuid()" in str(pk.server_default.arg), table.name


def test_foreign_keys_restrict_except_snapshot_children() -> None:
    cascades = set()
    for table in Base.metadata.tables.values():
        for constraint in table.constraints:
            if isinstance(constraint, ForeignKeyConstraint):
                if constraint.ondelete == "CASCADE":
                    cascades.add(table.name)
                else:
                    assert constraint.ondelete == "RESTRICT", constraint.name
    assert cascades == {"category_result_entries", "audit_event_changes"}


def test_scores_are_smallint_and_weights_are_numeric() -> None:
    tables = Base.metadata.tables
    assert isinstance(tables["evaluation_scores"].c.score.type, SmallInteger)
    assert isinstance(tables["achievement_criteria"].c.max_score.type, SmallInteger)
    assert isinstance(tables["achievement_criteria"].c.weight.type, Numeric)
    assert isinstance(tables["category_result_entries"].c.total_score.type, Numeric)


def test_clerk_references_are_text() -> None:
    for table in Base.metadata.tables.values():
        for column in table.columns:
            if "clerk_user_id" in column.name:
                assert column.type.__class__.__name__ == "Text", f"{table.name}.{column.name}"


def test_seed_file_has_the_16_official_categories() -> None:
    data = json.loads(Path(SEED_FILE).read_text(encoding="utf-8"))
    categories = data["categories"]
    assert len(categories) == 16
    assert len({c["name"] for c in categories}) == 16
    assert [c["sort_order"] for c in categories] == list(range(1, 17))
    for category in categories:
        for field in ("name", "short_name", "group_name", "purpose", "nominator_guidance"):
            assert category[field], f"{category['name']}: {field} is empty"
        assert category["eligibility_criteria"]
        assert all(a["max_score"] == 5 for a in category["achievement_criteria"])
    _check_weights(categories)  # every category's weights total exactly 1
    assert all(
        Decimal("0") < Decimal(a["weight"]) <= 1
        for c in categories
        for a in c["achievement_criteria"]
    )
