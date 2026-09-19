from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.services.clerk import verify_clerk_token

_bearer = HTTPBearer(auto_error=False)


def get_current_user_id(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> str:
    """Return the Clerk user ID from the request's bearer token, or raise 401.

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
        claims = verify_clerk_token(credentials.credentials)
    except jwt.PyJWTError:
        raise unauthorized from None
    return str(claims["sub"])


CurrentUserId = Annotated[str, Depends(get_current_user_id)]
