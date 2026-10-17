from fastapi import APIRouter, Depends

from app.api.deps import current_user
from app.db.models import User

router = APIRouter()


@router.get("/me")
def me(user: User = Depends(current_user)) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "locale": user.locale,
        "currency": user.currency,
        "role": user.role,
        "created_at": user.created_at,
    }
