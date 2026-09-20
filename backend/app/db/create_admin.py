"""Create the first administrator (there is no other way in until one exists).

Run from `backend/` with the venv active:

    python -m app.db.create_admin --email you@example.org --name "Your Name" \
        --clerk-user-id user_2abc...

With `--clerk-user-id` (from the Clerk dashboard) the admin is active immediately. Without it
the admin is created as `invited` and is linked on first sign-in by email, which needs the
`email` claim in the Clerk session token (see README).

Safe to re-run: an existing user with the same email is left exactly as it is.
"""

import argparse
import asyncio

from sqlalchemy import func, select

from app.db.session import SessionLocal, engine
from app.models import AppUser


async def create_admin(email: str, name: str, clerk_user_id: str | None) -> str:
    async with SessionLocal() as session, session.begin():
        existing = await session.scalar(
            select(AppUser).where(func.lower(AppUser.email) == email.lower())
        )
        if existing is not None:
            return f"Already exists ({existing.role}, {existing.status}); nothing changed."
        session.add(
            AppUser(
                email=email,
                display_name=name,
                role="admin",
                status="active" if clerk_user_id else "invited",
                clerk_user_id=clerk_user_id,
            )
        )
    return "Created admin " + ("(active)." if clerk_user_id else "(invited; links on first sign-in).")


async def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--email", required=True)
    parser.add_argument("--name", required=True)
    parser.add_argument("--clerk-user-id")
    args = parser.parse_args()
    try:
        print(await create_admin(args.email, args.name, args.clerk_user_id))
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
