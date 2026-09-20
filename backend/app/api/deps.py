from collections.abc import Callable
from dataclasses import dataclass
from typing import Annotated, Any

import jwt
from fastapi import Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.models import AppUser
from app.services.clerk import verify_clerk_token
from app.services.users import AccessDenied, get_active_user

_bearer = HTTPBearer(auto_error=False)

MAX_LIMIT = 100


def get_verified_claims(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> dict[str, Any]:
    """Return the verified Clerk token claims, or raise 401.

    Declared sync on purpose: fetching the JWKS is blocking I/O, so FastAPI
    runs this in its threadpool instead of blocking the event loop.
    """
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing authentication token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise unauthorized
    try:
        return verify_clerk_token(credentials.credentials)
    except jwt.PyJWTError:
        raise unauthorized from None


async def get_current_user(
    claims: Annotated[dict[str, Any], Depends(get_verified_claims)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> AppUser:
    """The active `app_users` row for the signed-in Clerk user. A valid login alone is not
    enough: no row, an `invited` row that could not be linked, or a deactivated user gets 403."""
    email = claims.get("email")
    try:
        return await get_active_user(
            session, str(claims["sub"]), email if isinstance(email, str) else None
        )
    except AccessDenied as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=exc.message) from None


CurrentUser = Annotated[AppUser, Depends(get_current_user)]


def require_role(role: str) -> Callable[[AppUser], AppUser]:
    """Dependency factory: the current user must be active and have exactly this role."""

    def dependency(user: CurrentUser) -> AppUser:
        if user.role != role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to access this resource.",
            )
        return user

    return dependency


RequireAdmin = Annotated[AppUser, Depends(require_role("admin"))]
RequireAdjudicator = Annotated[AppUser, Depends(require_role("adjudicator"))]


@dataclass
class Pagination:
    limit: int
    offset: int


def get_pagination(
    limit: Annotated[int, Query(ge=1)] = 25, offset: Annotated[int, Query(ge=0)] = 0
) -> Pagination:
    """`limit` defaults to 25 and is capped at MAX_LIMIT (larger values are reduced to it)."""
    return Pagination(limit=min(limit, MAX_LIMIT), offset=offset)


PageParams = Annotated[Pagination, Depends(get_pagination)]
