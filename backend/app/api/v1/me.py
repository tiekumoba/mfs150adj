from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, PageParams, RequireAdjudicator
from app.db.session import get_session
from app.schemas.assignments import AssignmentResponse
from app.schemas.common import Page
from app.schemas.users import UserResponse
from app.services.assignments import list_active_assignments

router = APIRouter(tags=["me"])


@router.get("/me", response_model=UserResponse)
async def read_me(user: CurrentUser) -> UserResponse:
    """The signed-in user's application account (any active role)."""
    return UserResponse.model_validate(user)


@router.get("/me/assignments", response_model=Page[AssignmentResponse])
async def list_my_assignments(
    user: RequireAdjudicator,
    page: PageParams,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> Page[AssignmentResponse]:
    """Adjudicators only: the categories the caller is actively assigned to."""
    assignments, total = await list_active_assignments(session, user.id, page.limit, page.offset)
    return Page(
        items=[AssignmentResponse.model_validate(a) for a in assignments],
        total=total,
        limit=page.limit,
        offset=page.offset,
    )
