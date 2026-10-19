from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import current_user
from app.api.routes.goals import goals_out
from app.api.routes.months import carry_forward, month_out
from app.db.models import Goal, Month, Profile, User
from app.db.session import get_session
from app.domain.account_rules import account_suggestions
from app.domain.months import SAVE_KINDS, rate_bp, sun_steps
from app.domain.suggestions import suggest
from app.schemas.budget import MonthOut
from app.schemas.goals import GoalOut
from app.schemas.simulation import SimulationIn, Suggestion
from app.services import auth

router = APIRouter()


class Rate(BaseModel):
    year_month: str
    savings_rate_bp: int


class DashboardOut(BaseModel):
    first_name: str | None
    currency: str
    current_month: MonthOut | None
    closed_count: int
    steps: int
    rates: list[Rate]
    saved_total: int
    goals: list[GoalOut]
    suggestions: list[Suggestion]


@router.get("/dashboard", response_model=DashboardOut)
def dashboard(db: Session = Depends(get_session), user: User = Depends(current_user)):
    ym = auth.now().strftime("%Y-%m")
    months = list(db.scalars(select(Month).where(Month.user_id == user.id).order_by(Month.year_month)))
    if months and not any(m.year_month == ym for m in months):  # returning user: the new month starts like the last one
        months.append(carry_forward(db, user, ym, months[-1]))
        db.commit()
        months.sort(key=lambda m: m.year_month)
    closed = [m for m in months if m.closed_at is not None]
    rates = [rate_bp(m.income, m.envelopes) for m in closed]
    goals = list(db.scalars(select(Goal).where(Goal.user_id == user.id).order_by(Goal.created_at)))
    cur = next((m for m in months if m.year_month == ym), None)
    p = db.get(Profile, user.id)
    out: list[Suggestion] = []
    if cur:
        custom = [{"kind": e["kind"], "pct": e["pct"], "label": e["label"]} for e in cur.envelopes] if cur.method == "custom" else None
        out = suggest(SimulationIn(
            income=cur.income, currency=cur.currency, method=cur.method, envelopes=custom,
            essentials=p.essentials if p else None, has_debt=p.has_debt if p else None, savings=p.savings if p else None,
        ))
    return DashboardOut(
        first_name=user.first_name, currency=user.currency, current_month=month_out(cur) if cur else None,
        closed_count=len(closed), steps=sun_steps(rates),
        rates=[Rate(year_month=m.year_month, savings_rate_bp=r) for m, r in list(zip(closed, rates))[-12:]],
        saved_total=sum(e["actual"] for m in closed if m.currency == user.currency for e in m.envelopes if e["kind"] in SAVE_KINDS),
        goals=goals_out(db, user, goals), suggestions=out + account_suggestions(months, goals, ym),
    )
