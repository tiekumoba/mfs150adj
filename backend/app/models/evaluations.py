import uuid
from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    SmallInteger,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.awards import AchievementCriterion, EligibilityCriterion
from app.models.mixins import Timestamps, UUIDPrimaryKey, one_of
from app.models.nominations import Candidacy
from app.models.users import AdjudicatorAssignment

EVALUATION_STATUSES = ("draft", "submitted", "reopened")
CHECK_RESULTS = ("pass", "fail")
CONFLICT_STATUSES = ("declared", "cleared")


class Evaluation(UUIDPrimaryKey, Timestamps, Base):
    """One adjudicator's independent assessment of one candidacy.

    No row means "not started".
    """

    __tablename__ = "evaluations"
    __table_args__ = (
        UniqueConstraint("assignment_id", "candidacy_id"),
        CheckConstraint(one_of("status", EVALUATION_STATUSES), name="status"),
        CheckConstraint(
            "status <> 'submitted' OR submitted_at IS NOT NULL", name="submitted_has_time"
        ),
    )

    assignment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("adjudicator_assignments.id", ondelete="RESTRICT")
    )
    candidacy_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("candidacies.id", ondelete="RESTRICT")
    )
    status: Mapped[str] = mapped_column(Text)
    conclusion: Mapped[str | None] = mapped_column(Text)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    assignment: Mapped[AdjudicatorAssignment] = relationship(back_populates="evaluations")
    candidacy: Mapped[Candidacy] = relationship()
    eligibility_checks: Mapped[list["EvaluationEligibilityCheck"]] = relationship(
        back_populates="evaluation"
    )
    scores: Mapped[list["EvaluationScore"]] = relationship(back_populates="evaluation")


class EvaluationEligibilityCheck(UUIDPrimaryKey, Timestamps, Base):
    """One row per eligibility criterion."""

    __tablename__ = "evaluation_eligibility_checks"
    __table_args__ = (
        UniqueConstraint("evaluation_id", "criterion_id"),
        CheckConstraint(one_of("result", CHECK_RESULTS), name="result"),
    )

    evaluation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("evaluations.id", ondelete="RESTRICT")
    )
    criterion_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        # Explicit name: the generated one exceeds PostgreSQL's 63-character limit.
        ForeignKey(
            "eligibility_criteria.id",
            ondelete="RESTRICT",
            name="fk_evaluation_eligibility_checks_criterion_id",
        ),
    )
    result: Mapped[str | None] = mapped_column(Text)  # null while not yet assessed
    evidence_reviewed: Mapped[str | None] = mapped_column(Text)
    comment: Mapped[str | None] = mapped_column(Text)

    evaluation: Mapped[Evaluation] = relationship(back_populates="eligibility_checks")
    criterion: Mapped[EligibilityCriterion] = relationship()


class EvaluationScore(UUIDPrimaryKey, Timestamps, Base):
    """One row per achievement criterion. Individual scores are never discarded."""

    __tablename__ = "evaluation_scores"
    __table_args__ = (
        UniqueConstraint("evaluation_id", "criterion_id"),
        CheckConstraint("score >= 0", name="score_non_negative"),
    )

    evaluation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("evaluations.id", ondelete="RESTRICT")
    )
    criterion_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("achievement_criteria.id", ondelete="RESTRICT")
    )
    score: Mapped[int | None] = mapped_column(SmallInteger)  # null while not yet scored
    basis: Mapped[str | None] = mapped_column(Text)

    evaluation: Mapped[Evaluation] = relationship(back_populates="scores")
    criterion: Mapped[AchievementCriterion] = relationship()


class AdjudicatorConflict(UUIDPrimaryKey, Timestamps, Base):
    """An adjudicator declares that they cannot fairly assess a candidacy."""

    __tablename__ = "adjudicator_conflicts"
    __table_args__ = (
        UniqueConstraint("assignment_id", "candidacy_id"),
        CheckConstraint(one_of("status", CONFLICT_STATUSES), name="status"),
        CheckConstraint(
            "status <> 'cleared' OR (cleared_at IS NOT NULL "
            "AND cleared_by_clerk_user_id IS NOT NULL AND clear_reason IS NOT NULL)",
            name="cleared_has_details",
        ),
    )

    assignment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("adjudicator_assignments.id", ondelete="RESTRICT")
    )
    # Must be in the assignment's category (service layer).
    candidacy_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("candidacies.id", ondelete="RESTRICT")
    )
    status: Mapped[str] = mapped_column(Text)
    reason: Mapped[str] = mapped_column(Text)
    declared_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    cleared_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cleared_by_clerk_user_id: Mapped[str | None] = mapped_column(Text)
    clear_reason: Mapped[str | None] = mapped_column(Text)

    assignment: Mapped[AdjudicatorAssignment] = relationship(back_populates="conflicts")
    candidacy: Mapped[Candidacy] = relationship()
