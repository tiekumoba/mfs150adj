from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AppUser


class AccessDenied(Exception):
    """A valid Clerk login that may not use the application."""

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


async def _find_by_clerk_id(session: AsyncSession, clerk_user_id: str) -> AppUser | None:
    return await session.scalar(select(AppUser).where(AppUser.clerk_user_id == clerk_user_id))


async def _link_invited_user(session: AsyncSession, clerk_user_id: str, email: str) -> None:
    """On first sign-in, attach the Clerk ID to the invited row with this email and activate it."""
    invited = await session.scalar(
        select(AppUser)
        .where(
            func.lower(AppUser.email) == email.lower(),
            AppUser.status == "invited",
            AppUser.clerk_user_id.is_(None),
        )
        .with_for_update()
    )
    if invited is not None:
        invited.clerk_user_id = clerk_user_id
        invited.status = "active"
    await session.commit()


async def get_active_user(
    session: AsyncSession, clerk_user_id: str, email: str | None
) -> AppUser:
    """Return the active `app_users` row for a verified Clerk user, or raise AccessDenied.

    `email` is the verified email from the Clerk token, used only to link an invited
    user the first time they sign in.
    """
    user = await _find_by_clerk_id(session, clerk_user_id)
    if user is None and email:
        await _link_invited_user(session, clerk_user_id, email)
        # Re-read rather than trust the link result: a parallel first request may have won.
        user = await _find_by_clerk_id(session, clerk_user_id)

    if user is None:
        raise AccessDenied("This account has not been invited to the application.")
    if user.status == "deactivated":
        raise AccessDenied("This account has been deactivated.")
    if user.status != "active":
        raise AccessDenied("This account is not active.")
    return user


async def list_users(session: AsyncSession, limit: int, offset: int) -> tuple[list[AppUser], int]:
    total = await session.scalar(select(func.count()).select_from(AppUser)) or 0
    result = await session.scalars(
        select(AppUser).order_by(func.lower(AppUser.email), AppUser.id).limit(limit).offset(offset)
    )
    return list(result), total
