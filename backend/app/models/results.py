import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.awards import Category
from app.models.mixins import CreatedAt, UUIDPrimaryKey, one_of
from app.models.nominations import CategoryEntry

RESULT_OUTCOMES = ("ranked", "ineligible", "insufficient_evaluations")


class CategoryResult(UUIDPrimaryKey, CreatedAt, Base):
    """An immutable snapshot produced when a category is finalized."""

    __tablename__ = "category_results"
    __table_args__ = (
        CheckConstraint(
            "superseded_at IS NULL OR "
            "(supersede_reason IS NOT NULL AND superseded_by_clerk_user_id IS NOT NULL)",
            name="superseded_has_details",
        ),
        # Only one current (non-superseded) result per category.
        Index(
            "uq_category_results_current",
            "category_id",
            unique=True,
            postgresql_where=text("superseded_at IS NULL"),
        ),
    )

    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id", ondelete="RESTRICT")
    )
    # Copied from the category at finalization.
    aggregation_method: Mapped[str] = mapped_column(Text)
    eligibility_rule: Mapped[str] = mapped_column(Text)
    minimum_evaluations: Mapped[int] = mapped_column(Integer)
    finalized_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    finalized_by_clerk_user_id: Mapped[str] = mapped_column(Text)
    superseded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    superseded_by_clerk_user_id: Mapped[str | None] = mapped_column(Text)
    supersede_reason: Mapped[str | None] = mapped_column(Text)

    category: Mapped[Category] = relationship(back_populates="results")
    entries: Mapped[list["CategoryResultEntry"]] = relationship(
        back_populates="result", cascade="all, delete-orphan", passive_deletes=True
    )


class CategoryResultEntry(UUIDPrimaryKey, Base):
    """One row per accepted category entry in the category."""

    __tablename__ = "category_result_entries"
    __table_args__ = (
        UniqueConstraint("result_id", "category_entry_id"),
        CheckConstraint(one_of("outcome", RESULT_OUTCOMES), name="outcome"),
        CheckConstraint(
            "(outcome = 'ranked') = (rank IS NOT NULL AND total_score IS NOT NULL)",
            name="ranked_has_rank_and_score",
        ),
    )

    result_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("category_results.id", ondelete="CASCADE")
    )
    category_entry_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("category_entries.id", ondelete="RESTRICT")
    )
    outcome: Mapped[str] = mapped_column(Text)  # the final outcome, not an adjudicator's
    rank: Mapped[int | None] = mapped_column(Integer)
    total_score: Mapped[Decimal | None] = mapped_column(Numeric(6, 3))  # out of 100
    evaluation_count: Mapped[int] = mapped_column(Integer)

    result: Mapped[CategoryResult] = relationship(back_populates="entries")
    category_entry: Mapped[CategoryEntry] = relationship()
