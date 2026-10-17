import secrets
import uuid
from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, Request, Response
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.db.models import Event, LoginToken, SessionToken, User
from app.db.session import get_session
from app.schemas.auth import RequestLink
from app.services import auth
from app.services.email import EmailError, send_login_link

router = APIRouter(prefix="/auth")

HOUR = timedelta(hours=1)
SESSION_TTL = timedelta(days=30)


def _retry_after(db: Session, column, value: str, limit: int) -> int | None:
    """Seconds until a slot frees up, or None if under the limit (counted from login_tokens)."""
    now = auth.now()
    times = db.scalars(select(LoginToken.created_at).where(column == value, LoginToken.created_at > now - HOUR).order_by(LoginToken.created_at)).all()
    if len(times) < limit:
        return None
    return max(1, int((times[0] + HOUR - now).total_seconds()) + 1)


@router.post("/request-link", status_code=202)
def request_link(body: RequestLink, request: Request, db: Session = Depends(get_session), settings: Settings = Depends(get_settings)):
    # shortcut: request.client is the proxy IP behind Render; switch to the forwarded IP if the limit proves too coarse.
    ip_hash = auth.hash_token(request.client.host if request.client else "unknown")
    waits = [w for w in (_retry_after(db, LoginToken.email, body.email, 5), _retry_after(db, LoginToken.ip_hash, ip_hash, 20)) if w]
    if waits:
        return JSONResponse({"detail": "rate_limited", "retry_after": max(waits)}, status_code=429)
    raw = secrets.token_urlsafe(32)
    now = auth.now()
    db.add(LoginToken(id=str(uuid.uuid4()), email=body.email, token_hash=auth.hash_token(raw), locale=body.locale,
                      next_path=body.next, ip_hash=ip_hash, expires_at=now + timedelta(minutes=15), created_at=now))
    db.commit()
    link = f"{settings.app_url}/api/auth/verify?token={raw}"
    try:
        send_login_link(body.email, link, body.locale, settings)
    except EmailError:
        return JSONResponse({"detail": "email_failed"}, status_code=502)
    return {"sent": True, **({"dev_link": link} if settings.env == "development" else {})}


@router.get("/verify")
def verify(token: str, db: Session = Depends(get_session), settings: Settings = Depends(get_settings)):
    row = db.scalar(select(LoginToken).where(LoginToken.token_hash == auth.hash_token(token)))
    now = auth.now()
    if row is None or row.used_at is not None or row.expires_at <= now:
        return RedirectResponse(f"/{row.locale if row else 'fr'}/connexion/lien-expire", status_code=303)
    row.used_at = now
    user = db.scalar(select(User).where(User.email == row.email))
    if user is None:
        user = User(id=str(uuid.uuid4()), email=row.email, locale=row.locale, consent_at=now, created_at=now,
                    role="admin" if row.email in settings.admin_emails else "user")
        db.add(user)
        db.add(Event(type="signup_completed", occurred_at=now, locale=row.locale))
        db.flush()
    raw = secrets.token_urlsafe(32)
    db.add(SessionToken(id_hash=auth.hash_token(raw), user_id=user.id, expires_at=now + SESSION_TTL, created_at=now))
    db.commit()
    resp = RedirectResponse(row.next_path or f"/{row.locale}/tableau-de-bord", status_code=303)
    resp.set_cookie(auth.SESSION_COOKIE, raw, max_age=int(SESSION_TTL.total_seconds()), httponly=True,
                    samesite="lax", path="/", secure=settings.env == "production")
    return resp


@router.post("/logout", status_code=204)
def logout(raw: Annotated[str | None, Cookie(alias=auth.SESSION_COOKIE)] = None, db: Session = Depends(get_session)):
    if raw and (row := db.get(SessionToken, auth.hash_token(raw))):
        db.delete(row)
        db.commit()
    resp = Response(status_code=204)
    resp.delete_cookie(auth.SESSION_COOKIE, path="/")
    return resp
