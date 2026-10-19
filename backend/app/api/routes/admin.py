from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import admin_user
from app.core.config import Settings, get_settings
from app.db.models import User
from app.db.session import get_session
from app.domain import impact
from app.services import auth

router = APIRouter()


class Usage(BaseModel):
    simulations: int | None
    comparisons: int | None
    signups_started: int | None
    signups_completed: int | None
    conversion_bp: int | None


class Cohort(BaseModel):
    cohort: str
    users: int | None
    m1_bp: int | None
    m2_bp: int | None
    m3_bp: int | None


class Savings(BaseModel):
    median_rate_bp: int | None
    improved_share_bp: int | None
    helpfulness_avg_x100: int | None


class Amount(BaseModel):
    currency: str
    saved_total: int | None


class ImpactOut(BaseModel):
    usage: Usage
    retention: list[Cohort]
    savings: Savings
    amounts: list[Amount]
    min_group: int


@router.get("/admin/impact", response_model=ImpactOut)
def get_impact(
    days: int = 30,
    currency: Annotated[str, Query(pattern=r"^([A-Za-z]{3,8}|all)$")] = "all",
    locale: Literal["fr", "en", "all"] = "all",
    db: Session = Depends(get_session),
    settings: Settings = Depends(get_settings),
    _: User = Depends(admin_user),
):
    if days not in (30, 90, 365):  # Literal[int] refuse les entiers de la query string
        raise HTTPException(422, "days must be 30, 90 or 365")
    return impact.compute(
        db, auth.now(), days, None if currency == "all" else currency.upper(), None if locale == "all" else locale, settings.admin_emails
    )
