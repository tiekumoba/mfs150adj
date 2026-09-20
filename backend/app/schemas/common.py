from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    """A page of a collection (see `limit` and `offset` on collection endpoints)."""

    items: list[T]
    total: int
    limit: int
    offset: int
