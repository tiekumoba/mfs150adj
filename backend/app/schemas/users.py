import uuid
from typing import Literal

from pydantic import BaseModel, ConfigDict

Role = Literal["admin", "adjudicator"]
UserStatus = Literal["invited", "active", "deactivated"]


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    clerk_user_id: str | None
    email: str
    display_name: str
    role: Role
    status: UserStatus
