from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import PageParams, RequireAdmin
from app.db.session import get_session
from app.schemas.common import Page
from app.schemas.users import UserResponse
from app.services.users import list_users

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=Page[UserResponse])
async def list_app_users(
    _admin: RequireAdmin,
    page: PageParams,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> Page[UserResponse]:
    """Admins only: everyone with access to the application, whatever their status."""
    users, total = await list_users(session, page.limit, page.offset)
    return Page(
        items=[UserResponse.model_validate(u) for u in users],
        total=total,
        limit=page.limit,
        offset=page.offset,
    )
