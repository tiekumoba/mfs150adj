import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.awards import Category
from app.models.mixins import Timestamps, UUIDPrimaryKey, one_of

USER_ROLES = ("admin", "adjudicator")
USER_STATUSES = ("invited", "active", "deactivated")
ASSIGNMENT_STATUSES = ("active", "revoked")


class AppUser(UUIDPrimaryKey, Timestamps, Base):
    """A person with a role in this system. Authentication stays with Clerk."""

    __tablename__ = "app_users"
    __table_args__ = (
        CheckConstraint(one_of("role", USER_ROLES), name="role"),
        CheckConstraint(one_of("status", USER_STATUSES), name="status"),
    )

    # Empty until the invitee accepts and first signs in. Unique when not null.
    clerk_user_id: Mapped[str | None] = mapped_column(Text, unique=True)
    email: Mapped[str] = mapped_column(Text, unique=True)
    display_name: Mapped[str] = mapped_column(Text)
    role: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Text)
    invited_by_clerk_user_id: Mapped[str | None] = mapped_column(Text)
    invited_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    assignments: Mapped[list["AdjudicatorAssignment"]] = relationship(
        back_populates="adjudicator"
    )


class AdjudicatorAssignment(UUIDPrimaryKey, Timestamps, Base):
    """An adjudicator assigned to a category."""

    __tablename__ = "adjudicator_assignments"
    __table_args__ = (
        UniqueConstraint("category_id", "adjudicator_id"),
        CheckConstraint(one_of("status", ASSIGNMENT_STATUSES), name="status"),
    )

    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id", ondelete="RESTRICT")
    )
    # Must be a user with role 'adjudicator' (service layer).
    adjudicator_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("app_users.id", ondelete="RESTRICT")
    )
    status: Mapped[str] = mapped_column(Text)
    assigned_by_clerk_user_id: Mapped[str | None] = mapped_column(Text)
    assigned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    category: Mapped[Category] = relationship(back_populates="assignments")
    adjudicator: Mapped[AppUser] = relationship(back_populates="assignments")
    evaluations: Mapped[list["Evaluation"]] = relationship(  # noqa: F821
        back_populates="assignment"
    )
    conflicts: Mapped[list["AdjudicatorConflict"]] = relationship(  # noqa: F821
        back_populates="assignment"
    )
