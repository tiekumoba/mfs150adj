"""SQLAlchemy models. Import each model module here so Alembic can see it."""

from app.models.audit import AuditEvent, AuditEventChange
from app.models.awards import (
    AchievementCriterion,
    Award,
    Category,
    EligibilityCriterion,
    TieBreakRule,
)
from app.models.evaluations import (
    AdjudicatorConflict,
    Evaluation,
    EvaluationEligibilityCheck,
    EvaluationScore,
)
from app.models.nominations import Candidacy, Nomination, NominationEvidence, Nominee
from app.models.results import CategoryResult, CategoryResultEntry
from app.models.users import AdjudicatorAssignment, AppUser

__all__ = [
    "AchievementCriterion",
    "AdjudicatorAssignment",
    "AdjudicatorConflict",
    "AppUser",
    "AuditEvent",
    "AuditEventChange",
    "Award",
    "Candidacy",
    "Category",
    "CategoryResult",
    "CategoryResultEntry",
    "EligibilityCriterion",
    "Evaluation",
    "EvaluationEligibilityCheck",
    "EvaluationScore",
    "Nomination",
    "NominationEvidence",
    "Nominee",
    "TieBreakRule",
]
