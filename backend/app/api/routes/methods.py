from typing import Any

from fastapi import APIRouter

from app.domain.methods import catalogue

router = APIRouter()


@router.get("/methods")
def methods() -> dict[str, Any]:
    return catalogue()
