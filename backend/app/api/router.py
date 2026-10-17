from fastapi import APIRouter

from app.api.routes import auth, health, me, methods, suggestions

api_router = APIRouter(prefix="/api")
api_router.include_router(health.router, tags=["health"])
api_router.include_router(methods.router, tags=["methods"])
api_router.include_router(suggestions.router, tags=["suggestions"])
api_router.include_router(auth.router, tags=["auth"])
api_router.include_router(me.router, tags=["me"])
