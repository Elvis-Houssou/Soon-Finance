from fastapi import APIRouter, Depends, Response
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.api.deps import current_user
from app.db.models import Goal, LoginToken, Month, Profile, User
from app.db.session import get_session
from app.schemas.account import MePatch
from app.services import auth

router = APIRouter()


def _row(obj) -> dict:
    return {c.name: getattr(obj, c.name) for c in obj.__table__.columns}


def _me(db: Session, user: User) -> dict:
    profile = db.get(Profile, user.id)
    return {
        "id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "locale": user.locale,
        "currency": user.currency,
        "role": user.role,
        "created_at": user.created_at,
        "essentials": profile.essentials if profile else None,
    }


@router.get("/me")
def me(db: Session = Depends(get_session), user: User = Depends(current_user)) -> dict:
    return _me(db, user)


@router.patch("/me")
def patch_me(body: MePatch, db: Session = Depends(get_session), user: User = Depends(current_user)) -> dict:
    # Existing months keep their own currency: no conversion.
    user.first_name, user.locale, user.currency = body.first_name, body.locale, body.currency
    db.commit()
    return _me(db, user)


@router.get("/me/export")
def export(db: Session = Depends(get_session), user: User = Depends(current_user)):
    profile = db.get(Profile, user.id)
    data = {
        "user": _row(user),
        "profile": _row(profile) if profile else None,
        "months": [_row(m) for m in db.scalars(select(Month).where(Month.user_id == user.id).order_by(Month.year_month))],
        "goals": [_row(g) for g in db.scalars(select(Goal).where(Goal.user_id == user.id).order_by(Goal.created_at))],
    }
    return JSONResponse(jsonable_encoder(data), headers={"Content-Disposition": 'attachment; filename="soon-finance-export.json"'})


@router.delete("/me", status_code=204)
def delete_me(db: Session = Depends(get_session), user: User = Depends(current_user)):
    # Sessions, profile, months, goals go via ON DELETE CASCADE; login tokens are keyed by email, not FK.
    db.execute(delete(LoginToken).where(LoginToken.email == user.email))
    db.delete(user)
    db.commit()
    resp = Response(status_code=204)
    resp.delete_cookie(auth.SESSION_COOKIE, path="/")
    return resp
