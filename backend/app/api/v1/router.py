from fastapi import APIRouter

from app.api.v1 import health, me, users

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(me.router)
api_router.include_router(users.router)
