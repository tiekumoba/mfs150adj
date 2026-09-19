import os

# Settings are read when app.main is imported, so set the environment first.
# Real environment variables take priority over any local .env file.
os.environ["DATABASE_URL"] = "postgresql://user:pass@localhost/test?sslmode=require"
os.environ["CLERK_JWKS_URL"] = "https://clerk.test/.well-known/jwks.json"
os.environ["CLERK_ISSUER"] = "https://clerk.test"
os.environ["CORS_ORIGINS"] = "http://localhost:5173"

import time
from collections.abc import Callable, Iterator
from typing import Any
from unittest.mock import patch

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi.testclient import TestClient

from app.main import app

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
