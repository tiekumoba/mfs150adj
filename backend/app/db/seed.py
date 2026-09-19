"""Seed the award and its 16 official categories from `seed/categories.json`.

Run from `backend/` with the venv active: `python -m app.db.seed`

Safe to run more than once. Anything that already exists is left exactly as it is, so
re-running never overwrites edits made by admins (criteria and weights freeze once the
award reaches `judging`). A category's criteria are only created together with the
category itself.
"""

import asyncio
import json
from dataclasses import dataclass
from decimal import Decimal
from pathlib import Path
from typing import Any

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import SessionLocal, engine
from app.models import AchievementCriterion, Award, Category, EligibilityCriterion

SEED_FILE = Path(__file__).resolve().parents[2] / "seed" / "categories.json"


@dataclass
class SeedResult:
    award_created: bool = False
    categories_created: int = 0
    categories_skipped: int = 0
    eligibility_criteria_created: int = 0
    achievement_criteria_created: int = 0


def _check_weights(categories: list[dict[str, Any]]) -> None:
    for category in categories:
        total = sum(Decimal(a["weight"]) for a in category["achievement_criteria"])
        if total != 1:
            raise ValueError(f"{category['name']}: weights total {total}, expected 1")


async def seed(session: AsyncSession, data: dict[str, Any]) -> SeedResult:
    result = SeedResult()
    _check_weights(data["categories"])

    award = await session.scalar(select(Award).where(Award.name == data["award"]["name"]))
    if award is None:
        award = Award(**data["award"])
        session.add(award)
        await session.flush()
        result.award_created = True

    for item in data["categories"]:
        # ON CONFLICT DO NOTHING on (award_id, name): returns no row if it already exists.
        category_id = await session.scalar(
            insert(Category)
            .values(
                award_id=award.id,
                name=item["name"],
                short_name=item["short_name"],
                group_name=item["group_name"],
                purpose=item["purpose"],
                nominator_guidance=item["nominator_guidance"],
                sort_order=item["sort_order"],
            )
            .on_conflict_do_nothing(index_elements=["award_id", "name"])
            .returning(Category.id)
        )
        if category_id is None:
            result.categories_skipped += 1
            continue
        result.categories_created += 1

        for order, description in enumerate(item["eligibility_criteria"], start=1):
            session.add(
                EligibilityCriterion(
                    category_id=category_id, description=description, sort_order=order
                )
            )
            result.eligibility_criteria_created += 1

        for order, criterion in enumerate(item["achievement_criteria"], start=1):
            session.add(
                AchievementCriterion(
                    category_id=category_id,
                    description=criterion["description"],
                    weight=Decimal(criterion["weight"]),
                    weight_rationale=criterion["weight_rationale"],
                    max_score=criterion["max_score"],
                    sort_order=order,
                )
            )
            result.achievement_criteria_created += 1

    return result


async def main() -> None:
    data = json.loads(SEED_FILE.read_text(encoding="utf-8"))
    try:
        async with SessionLocal() as session, session.begin():
            result = await seed(session, data)
    finally:
        await engine.dispose()
    print(result)


if __name__ == "__main__":
    asyncio.run(main())
