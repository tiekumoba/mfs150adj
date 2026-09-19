import uuid

from sqlalchemy import CheckConstraint, ForeignKey, Index, Text, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.awards import Award, Category
from app.models.mixins import CreatedAt, Timestamps, UUIDPrimaryKey, one_of

CATEGORY_ENTRY_STATUSES = ("pending", "accepted", "rejected", "withdrawn")
EVIDENCE_KINDS = ("image", "document")


class Nominee(UUIDPrimaryKey, Timestamps, Base):
    """A person or organisation being nominated."""

    __tablename__ = "nominees"
    # Helps spot duplicate names.
    __table_args__ = (Index("ix_nominees_lower_name", text("lower(name)")),)

    award_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("awards.id", ondelete="RESTRICT")
    )
    name: Mapped[str] = mapped_column(Text)

    award: Mapped[Award] = relationship(back_populates="nominees")
    category_entries: Mapped[list["CategoryEntry"]] = relationship(back_populates="nominee")


class CategoryEntry(UUIDPrimaryKey, Timestamps, Base):
    """A nominee competing in one category. This is the thing adjudicators assess."""

    __tablename__ = "category_entries"
    __table_args__ = (
        UniqueConstraint("category_id", "nominee_id"),
        CheckConstraint(one_of("status", CATEGORY_ENTRY_STATUSES), name="status"),
    )

    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id", ondelete="RESTRICT")
    )
    nominee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("nominees.id", ondelete="RESTRICT")
    )
    # Administrative only; says nothing about eligibility.
    status: Mapped[str] = mapped_column(Text)
    status_reason: Mapped[str | None] = mapped_column(Text)

    category: Mapped[Category] = relationship(back_populates="category_entries")
    nominee: Mapped[Nominee] = relationship(back_populates="category_entries")
    nominations: Mapped[list["Nomination"]] = relationship(back_populates="category_entry")


class Nomination(UUIDPrimaryKey, Timestamps, Base):
    """One submission by one nominator for a category entry."""

    __tablename__ = "nominations"

    category_entry_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("category_entries.id", ondelete="RESTRICT")
    )
    # Hidden from adjudicators while awards.reveal_nominator_details is false.
    nominator_name: Mapped[str] = mapped_column(Text)
    nominator_phone: Mapped[str | None] = mapped_column(Text)
    justification: Mapped[str] = mapped_column(Text)
    # Source value ("independent" so far); no CHECK until all values are known.
    submission_status: Mapped[str] = mapped_column(Text)

    category_entry: Mapped[CategoryEntry] = relationship(back_populates="nominations")
    evidence: Mapped[list["NominationEvidence"]] = relationship(back_populates="nomination")


class NominationEvidence(UUIDPrimaryKey, CreatedAt, Base):
    """A file supporting a nomination, kept as its existing external URL."""

    __tablename__ = "nomination_evidence"
    __table_args__ = (CheckConstraint(one_of("kind", EVIDENCE_KINDS), name="kind"),)

    nomination_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("nominations.id", ondelete="RESTRICT")
    )
    kind: Mapped[str] = mapped_column(Text)
    url: Mapped[str] = mapped_column(Text)
    filename: Mapped[str] = mapped_column(Text)

    nomination: Mapped[Nomination] = relationship(back_populates="evidence")
