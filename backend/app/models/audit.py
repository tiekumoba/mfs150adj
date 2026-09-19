import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import UUIDPrimaryKey

# Actions that must carry a reason (enforced by the database).
ACTIONS_REQUIRING_REASON = ("evaluation.reopened", "conflict.cleared", "result.superseded")


class AuditEvent(UUIDPrimaryKey, Base):
    """Append-only record of who did what."""

    __tablename__ = "audit_events"
    __table_args__ = (
        CheckConstraint(
            "reason IS NOT NULL OR action NOT IN ("
            + ", ".join(repr(a) for a in ACTIONS_REQUIRING_REASON)
            + ")",
            name="reason_required",
        ),
    )

    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    actor_clerk_user_id: Mapped[str] = mapped_column(Text)
    action: Mapped[str] = mapped_column(Text)
    entity_type: Mapped[str] = mapped_column(Text)
    # Deliberately not a foreign key, so history survives any change to the target.
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    reason: Mapped[str | None] = mapped_column(Text)

    changes: Mapped[list["AuditEventChange"]] = relationship(
        back_populates="event", cascade="all, delete-orphan", passive_deletes=True
    )


class AuditEventChange(UUIDPrimaryKey, Base):
    """Append-only, one row per changed field. Values are stored as text."""

    __tablename__ = "audit_event_changes"

    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("audit_events.id", ondelete="CASCADE")
    )
    field_name: Mapped[str] = mapped_column(Text)
    old_value: Mapped[str | None] = mapped_column(Text)
    new_value: Mapped[str | None] = mapped_column(Text)

    event: Mapped[AuditEvent] = relationship(back_populates="changes")
