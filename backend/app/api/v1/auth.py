from fastapi import APIRouter

from app.api.deps import CurrentUserId
from app.schemas.auth import MeResponse

router = APIRouter(tags=["auth"])


@router.get("/me", response_model=MeResponse)
async def me(user_id: CurrentUserId) -> MeResponse:
    return MeResponse(user_id=user_id)
