import uuid
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import current_user
from app.db.models import Event, Month, Profile, User
from app.db.session import get_session
from app.domain.months import YM, kept, next_ym, plan_envelopes, rate_bp, sun_steps
from app.schemas.budget import CloseIn, CloseOut, MonthOut, MonthPlanIn, ProfileIn, Review
from app.schemas.simulation import PlanIn, SimulationIn
from app.services import auth

router = APIRouter()
EDIT_WINDOW = timedelta(days=7)


def month_out(m: Month) -> MonthOut:
    done = m.closed_at is not None
    return MonthOut(
        year_month=m.year_month, income=m.income, currency=m.currency, method=m.method, envelopes=m.envelopes,
        review=Review(went_well=m.review_went_well, change_next=m.review_change_next) if done else None,
        helpfulness=m.helpfulness, closed_at=m.closed_at, editable_until=m.closed_at + EDIT_WINDOW if done else None,
        savings_rate_bp=rate_bp(m.income, m.envelopes) if done else None, kept=kept(m.envelopes) if done else None,
    )


def _custom(body: PlanIn) -> list[dict] | None:
    return [e.model_dump() for e in body.envelopes] if body.envelopes else None


def _get(db: Session, user: User, ym: str) -> Month | None:
    return db.scalar(select(Month).where(Month.user_id == user.id, Month.year_month == ym))


def _get_or_404(db: Session, user: User, ym: str) -> Month:
    m = _get(db, user, ym) if YM.match(ym) else None
    if m is None:
        raise HTTPException(404, "not_found")
    return m


def _create_if_missing(db: Session, user: User, ym: str, income: int, currency: str, method: str, custom: list[dict] | None) -> Month:
    """Insert the month; a concurrent insert (unique constraint) just yields the existing row."""
    try:
        with db.begin_nested():
            m = Month(id=str(uuid.uuid4()), user_id=user.id, year_month=ym, income=income, currency=currency, method=method,
                      envelopes=plan_envelopes(income, method, custom), created_at=auth.now())
            db.add(m)
            db.flush()
        return m
    except IntegrityError:
        return _get(db, user, ym)


def carry_forward(db: Session, user: User, ym: str, src: Month) -> Month:
    """Create month `ym` from `src` (income, currency, method, custom envelopes with labels)."""
    custom = [{"label": e["label"], "kind": e["kind"], "pct": e["pct"]} for e in src.envelopes] if src.method == "custom" else None
    return _create_if_missing(db, user, ym, src.income, src.currency, src.method, custom)


def _replan(m: Month, income: int, currency: str, method: str, custom: list[dict] | None) -> None:
    m.income, m.currency, m.method = income, currency, method
    m.envelopes = plan_envelopes(income, method, custom)


def _set_profile(db: Session, user: User, body) -> None:
    profile = db.get(Profile, user.id) or Profile(user_id=user.id)
    db.add(profile)
    profile.essentials, profile.has_debt, profile.savings = body.essentials, body.has_debt, body.savings


@router.post("/onboarding", response_model=MonthOut)
def onboarding(body: SimulationIn, db: Session = Depends(get_session), user: User = Depends(current_user)):
    _set_profile(db, user, body)
    user.currency = body.currency
    ym = auth.now().strftime("%Y-%m")
    m = _get(db, user, ym) or _create_if_missing(db, user, ym, body.income, body.currency, body.method, _custom(body))
    if m.closed_at is None:  # saving again from the simulator replaces an open plan; a closed month is left alone
        _replan(m, body.income, body.currency, body.method, _custom(body))
    db.commit()
    return month_out(m)


@router.put("/profile")
def put_profile(body: ProfileIn, db: Session = Depends(get_session), user: User = Depends(current_user)):
    _set_profile(db, user, body)
    db.commit()
    return body


@router.get("/months", response_model=list[MonthOut])
def list_months(db: Session = Depends(get_session), user: User = Depends(current_user)):
    return [month_out(m) for m in db.scalars(select(Month).where(Month.user_id == user.id).order_by(Month.year_month.desc()))]


@router.get("/months/{ym}", response_model=MonthOut)
def get_month(ym: str, db: Session = Depends(get_session), user: User = Depends(current_user)):
    return month_out(_get_or_404(db, user, ym))


@router.put("/months/{ym}", response_model=MonthOut)
def put_month(ym: str, body: MonthPlanIn, db: Session = Depends(get_session), user: User = Depends(current_user)):
    if not YM.match(ym):
        raise HTTPException(404, "not_found")
    m = _get(db, user, ym) or _create_if_missing(db, user, ym, body.income, body.currency, body.method, _custom(body))
    if m.closed_at is not None:
        return JSONResponse({"detail": "closed"}, status_code=409)
    _replan(m, body.income, body.currency, body.method, _custom(body))
    db.commit()
    return month_out(m)


def _claim_close(db: Session, m: Month, now) -> bool:
    """Atomically set closed_at; False if a concurrent request closed the month first."""
    return db.execute(update(Month).where(Month.id == m.id, Month.closed_at.is_(None)).values(closed_at=now)).rowcount == 1


@router.post("/months/{ym}/close", response_model=CloseOut)
def close_month(ym: str, body: CloseIn, db: Session = Depends(get_session), user: User = Depends(current_user)):
    m = _get_or_404(db, user, ym)
    now = auth.now()
    if ym > now.strftime("%Y-%m"):
        return JSONResponse({"detail": "future"}, status_code=409)
    if m.closed_at is not None and now - m.closed_at > EDIT_WINDOW:
        return JSONResponse({"detail": "locked"}, status_code=409)
    if len(body.actuals) != len(m.envelopes):
        raise HTTPException(422, "actuals_length")
    if sum(body.actuals) != m.income:
        return JSONResponse({"detail": "totals_mismatch"}, status_code=422)
    first = m.closed_at is None and _claim_close(db, m, now)
    if first:
        m.closed_at = now
    else:
        db.refresh(m)  # re-close, or lost the claim: keep the existing closed_at
    m.envelopes = [{**e, "actual": a} for e, a in zip(m.envelopes, body.actuals, strict=True)]
    m.review_went_well, m.review_change_next, m.helpfulness = body.went_well, body.change_next, body.helpfulness
    nxt = next_ym(ym)
    if _get(db, user, nxt) is None:
        carry_forward(db, user, nxt, m)
    if first:
        db.add(Event(type="month_closed", occurred_at=now, locale=user.locale, currency=m.currency))
    db.commit()
    closed = db.scalars(select(Month).where(Month.user_id == user.id, Month.closed_at.is_not(None)).order_by(Month.year_month)).all()
    rates = [rate_bp(c.income, c.envelopes) for c in closed]
    idx = next(i for i, c in enumerate(closed) if c.year_month == ym)
    return CloseOut(month=month_out(m), previous_rate_bp=rates[idx - 1] if idx else None, steps=sun_steps(rates))
