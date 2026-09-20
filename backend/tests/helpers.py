"""Helpers for arranging database test data."""

import asyncio
import itertools
import uuid
from collections.abc import Awaitable, Callable
from typing import Any, TypeVar

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession

from app.models import AdjudicatorAssignment, AppUser, Award, Category

T = TypeVar("T")


class Db:
    """Small helper for arranging test data. Each call is its own transaction."""

    def __init__(self, engine: AsyncEngine) -> None:
        self.engine = engine
        self._counter = itertools.count(1)
        self._award_id: uuid.UUID | None = None

    def run(self, work: Callable[[AsyncSession], Awaitable[T]]) -> T:
        async def go() -> T:
            async with AsyncSession(self.engine, expire_on_commit=False) as session:
                result = await work(session)
                await session.commit()
                return result

        return asyncio.run(go())

    def add_user(self, **fields: Any) -> AppUser:
        n = next(self._counter)
        user = AppUser(
            **{
                "email": f"user{n}@example.org",
                "display_name": f"User {n}",
                "role": "adjudicator",
                "status": "active",
                "clerk_user_id": f"user_{n}",
                **fields,
            }
        )

        async def work(session: AsyncSession) -> AppUser:
            session.add(user)
            return user

        return self.run(work)

    def get_user(self, user_id: uuid.UUID) -> AppUser:
        async def work(session: AsyncSession) -> AppUser:
            return await session.get_one(AppUser, user_id)

        return self.run(work)

    def add_category(self, name: str, sort_order: int = 1) -> Category:
        async def work(session: AsyncSession) -> Category:
            if self._award_id is None:
                award = Award(name="Test Award", status="draft")
                session.add(award)
                await session.flush()
                self._award_id = award.id
            category = Category(
                award_id=self._award_id,
                name=name,
                short_name=name,
                group_name="Test Group",
                sort_order=sort_order,
            )
            session.add(category)
            return category

        return self.run(work)

    def assign(self, user: AppUser, category: Category, status: str = "active") -> None:
        async def work(session: AsyncSession) -> None:
            session.add(
                AdjudicatorAssignment(adjudicator_id=user.id, category_id=category.id, status=status)
            )

        self.run(work)
