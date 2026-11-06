from fastapi import APIRouter

from app.api.routes import admin, auth, dashboard, events, fire, goals, health, me, methods, months, suggestions

api_router = APIRouter(prefix="/api")
api_router.include_router(health.router, tags=["health"])
api_router.include_router(methods.router, tags=["methods"])
api_router.include_router(fire.router, tags=["fire"])
api_router.include_router(suggestions.router, tags=["suggestions"])
api_router.include_router(auth.router, tags=["auth"])
api_router.include_router(me.router, tags=["me"])
api_router.include_router(months.router, tags=["months"])
api_router.include_router(review.router, tags=["review"])
api_router.include_router(events.router, tags=["events"])
api_router.include_router(goals.router, tags=["goals"])
api_router.include_router(projects.router, tags=["projects"])
api_router.include_router(dashboard.router, tags=["dashboard"])
api_router.include_router(admin.router, tags=["admin"])
