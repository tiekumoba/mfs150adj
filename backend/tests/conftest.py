import os

# Settings are read when app.main is imported, so set the environment first.
# Real environment variables take priority over any local .env file.
os.environ["DATABASE_URL"] = "postgresql://user:pass@localhost/test?sslmode=require"
os.environ["CLERK_JWKS_URL"] = "https://clerk.test/.well-known/jwks.json"
os.environ["CLERK_ISSUER"] = "https://clerk.test"
os.environ["CORS_ORIGINS"] = "http://localhost:5173"

import asyncio
import time
from collections.abc import AsyncIterator, Callable, Iterator
from typing import Any
from unittest.mock import patch

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import Settings
from app.db.base import Base
from app.db.session import get_session
from app.main import app

from tests.helpers import Db

_private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)


class _FakeSigningKey:
    key = _private_key.public_key()


class _FakeJwksClient:
    def get_signing_key_from_jwt(self, token: str) -> _FakeSigningKey:
        return _FakeSigningKey()


@pytest.fixture(autouse=True)
def fake_jwks() -> Iterator[None]:
    """Verify tokens against our local test key instead of fetching Clerk's JWKS."""
    with patch("app.services.clerk._jwks_client", return_value=_FakeJwksClient()):
        yield


@pytest.fixture
def client() -> TestClient:
    return TestClient(app, raise_server_exceptions=False)


@pytest.fixture
def make_token() -> Callable[..., str]:
    def _make(**overrides: Any) -> str:
        claims: dict[str, Any] = {
            "sub": "user_123",
            "iss": "https://clerk.test",
            "exp": int(time.time()) + 60,
        }
        claims.update(overrides)
        return jwt.encode(claims, _private_key, algorithm="RS256")

    return _make


# --- Database tests -------------------------------------------------------------------------
# These need a real PostgreSQL (the access rules live in SQL). Point TEST_DATABASE_URL at a
# throwaway database whose name ends in "_test"; its tables are created if missing and its rows
# are wiped between tests. Without it, database tests are skipped. Never use Neon here.


@pytest.fixture(scope="session")
def db_engine() -> Iterator[AsyncEngine]:
    url = os.environ.get("TEST_DATABASE_URL")
    if not url:
        pytest.skip("set TEST_DATABASE_URL (a database named *_test) to run database tests")
    if not (make_url(url).database or "").endswith("_test"):
        pytest.exit("TEST_DATABASE_URL must point at a database whose name ends in _test", 2)
    settings = Settings(database_url=url)  # type: ignore[call-arg]
    engine = create_async_engine(settings.sqlalchemy_database_url, poolclass=NullPool)

    async def create_tables() -> None:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    asyncio.run(create_tables())
    yield engine
    asyncio.run(engine.dispose())


@pytest.fixture
def db(db_engine: AsyncEngine) -> Iterator[Db]:
    """A clean database, wired into the app in place of the real one."""

    async def clear() -> None:
        async with db_engine.begin() as conn:
            await conn.execute(text("TRUNCATE awards, app_users CASCADE"))

    async def session_for_app() -> AsyncIterator[AsyncSession]:
        async with AsyncSession(db_engine, expire_on_commit=False) as session:
            yield session

    asyncio.run(clear())
    app.dependency_overrides[get_session] = session_for_app
    yield Db(db_engine)
    app.dependency_overrides.pop(get_session, None)
