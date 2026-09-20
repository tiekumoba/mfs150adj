import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CategorySummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    short_name: str
    group_name: str


class AssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: str
    assigned_at: datetime | None
    category: CategorySummary
