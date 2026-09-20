import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import AdjudicatorAssignment, Category


async def list_active_assignments(
    session: AsyncSession, adjudicator_id: uuid.UUID, limit: int, offset: int
) -> tuple[list[AdjudicatorAssignment], int]:
    """An adjudicator's active assignments only. Revoked ones give no access."""
    active = (
        AdjudicatorAssignment.adjudicator_id == adjudicator_id,
        AdjudicatorAssignment.status == "active",
    )
    total = (
        await session.scalar(select(func.count()).select_from(AdjudicatorAssignment).where(*active))
        or 0
    )
    result = await session.scalars(
        select(AdjudicatorAssignment)
        .join(Category)
        .where(*active)
        .options(selectinload(AdjudicatorAssignment.category))
        .order_by(Category.sort_order, Category.name)
        .limit(limit)
        .offset(offset)
    )
    return list(result), total
