from functools import lru_cache
from typing import Any

import jwt
from jwt import PyJWKClient

from app.core.config import get_settings


@lru_cache
def _jwks_client() -> PyJWKClient:
    # Caches the fetched signing keys and refetches when it sees an unknown key id.
    return PyJWKClient(get_settings().clerk_jwks_url)


def verify_clerk_token(token: str) -> dict[str, Any]:
    """Verify a Clerk session JWT and return its claims.

    Raises jwt.PyJWTError if the signature, issuer or expiry is invalid.
    """
    settings = get_settings()
    signing_key = _jwks_client().get_signing_key_from_jwt(token)
    claims: dict[str, Any] = jwt.decode(
        token,
        signing_key.key,
        algorithms=["RS256"],
        issuer=settings.clerk_issuer,
        leeway=10,  # tolerate small clock skew
        options={"require": ["exp", "iss", "sub"], "verify_aud": False},
    )
    # `azp` is the origin the token was issued to. Only accept our own frontends.
    azp = claims.get("azp")
    if azp is not None and azp not in settings.cors_origin_list:
        raise jwt.InvalidTokenError("Token was issued to an unauthorized party")
    return claims
