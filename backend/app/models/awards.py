import uuid
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    ForeignKey,
    Integer,
    Numeric,
    SmallInteger,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import Timestamps, UUIDPrimaryKey, one_of

AWARD_STATUSES = ("draft", "nominations", "judging", "finalized", "archived")


class Award(UUIDPrimaryKey, Timestamps, Base):
    """The programme (expected to be a single row)."""

    __tablename__ = "awards"
    __table_args__ = (CheckConstraint(one_of("status", AWARD_STATUSES), name="status"),)

    name: Mapped[str] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Text)
    reveal_nominator_details: Mapped[bool] = mapped_column(
        Boolean, server_default=text("false")
    )
    created_by_clerk_user_id: Mapped[str | None] = mapped_column(Text)

    categories: Mapped[list["Category"]] = relationship(back_populates="award")
    nominees: Mapped[list["Nominee"]] = relationship(back_populates="award")  # noqa: F821


class Category(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "categories"
    __table_args__ = (
        UniqueConstraint("award_id", "name"),
        CheckConstraint("minimum_evaluations >= 1", name="minimum_evaluations_positive"),
    )

    award_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("awards.id", ondelete="RESTRICT")
    )
    name: Mapped[str] = mapped_column(Text)
    short_name: Mapped[str] = mapped_column(Text)
    group_name: Mapped[str] = mapped_column(Text)
    purpose: Mapped[str | None] = mapped_column(Text)
    nominator_guidance: Mapped[str | None] = mapped_column(Text)
    # Chosen by an admin from the application's registry; no defaults.
    aggregation_method: Mapped[str | None] = mapped_column(Text)
    eligibility_rule: Mapped[str | None] = mapped_column(Text)
    minimum_evaluations: Mapped[int | None] = mapped_column(Integer)
    sort_order: Mapped[int | None] = mapped_column(Integer)

    award: Mapped[Award] = relationship(back_populates="categories")
    eligibility_criteria: Mapped[list["EligibilityCriterion"]] = relationship(
        back_populates="category", order_by="EligibilityCriterion.sort_order"
    )
    achievement_criteria: Mapped[list["AchievementCriterion"]] = relationship(
        back_populates="category", order_by="AchievementCriterion.sort_order"
    )
    tie_break_rules: Mapped[list["TieBreakRule"]] = relationship(
        back_populates="category", order_by="TieBreakRule.sort_order"
    )
    category_entries: Mapped[list["CategoryEntry"]] = relationship(  # noqa: F821
        back_populates="category"
    )
    assignments: Mapped[list["AdjudicatorAssignment"]] = relationship(  # noqa: F821
        back_populates="category"
    )
    results: Mapped[list["CategoryResult"]] = relationship(back_populates="category")  # noqa: F821


class EligibilityCriterion(UUIDPrimaryKey, Timestamps, Base):
    """A pass/fail statement."""

    __tablename__ = "eligibility_criteria"
    __table_args__ = (UniqueConstraint("category_id", "sort_order"),)

    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id", ondelete="RESTRICT")
    )
    description: Mapped[str] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(Integer)

    category: Mapped[Category] = relationship(back_populates="eligibility_criteria")


class AchievementCriterion(UUIDPrimaryKey, Timestamps, Base):
    """A weighted criterion scored on a whole-number scale."""

    __tablename__ = "achievement_criteria"
    __table_args__ = (
        UniqueConstraint("category_id", "sort_order"),
        CheckConstraint("weight > 0 AND weight <= 1", name="weight_range"),
        CheckConstraint("max_score > 0", name="max_score_positive"),
    )

    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id", ondelete="RESTRICT")
    )
    description: Mapped[str] = mapped_column(Text)
    # Fraction of 1; a category's weights must total 1.0 (checked in the service layer).
    weight: Mapped[Decimal] = mapped_column(Numeric(5, 4))
    weight_rationale: Mapped[str | None] = mapped_column(Text)
    # Top of the scale; the framework uses 0-5.
    max_score: Mapped[int] = mapped_column(SmallInteger, server_default=text("5"))
    sort_order: Mapped[int] = mapped_column(Integer)

    category: Mapped[Category] = relationship(back_populates="achievement_criteria")


class TieBreakRule(UUIDPrimaryKey, Timestamps, Base):
    """Ordered rules applied when candidates have equal totals."""

    __tablename__ = "tie_break_rules"
    __table_args__ = (UniqueConstraint("category_id", "sort_order"),)

    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id", ondelete="RESTRICT")
    )
    sort_order: Mapped[int] = mapped_column(Integer)  # lower is applied first
    rule_type: Mapped[str] = mapped_column(Text)  # identifier from the application's registry
    criterion_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("achievement_criteria.id", ondelete="RESTRICT")
    )

    category: Mapped[Category] = relationship(back_populates="tie_break_rules")
    criterion: Mapped[AchievementCriterion | None] = relationship()
