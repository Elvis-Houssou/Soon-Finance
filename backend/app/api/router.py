from fastapi import APIRouter

from app.api.routes import health, methods, suggestions

api_router = APIRouter(prefix="/api")
api_router.include_router(health.router, tags=["health"])
api_router.include_router(methods.router, tags=["methods"])
api_router.include_router(suggestions.router, tags=["suggestions"])
