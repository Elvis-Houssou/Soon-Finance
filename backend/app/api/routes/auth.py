import secrets
import uuid
from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, Request, Response
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
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


def _client_ip(request: Request, settings: Settings) -> str:
    # In production the app sits behind Vercel/Render, so client.host is the proxy.
    # shortcut: trusts the leftmost X-Forwarded-For entry, spoofable if the proxy appends rather than overwrites.
    forwarded = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    if settings.env == "production" and forwarded:
        return forwarded
    return request.client.host if request.client else "unknown"


def _claim(db: Session, token_id: str, now) -> bool:
    """Atomically mark the token used; False if someone else got there first."""
    return db.execute(update(LoginToken).where(LoginToken.id == token_id, LoginToken.used_at.is_(None)).values(used_at=now)).rowcount == 1


def _find_user(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email))


@router.post("/request-link", status_code=202)
def request_link(body: RequestLink, request: Request, db: Session = Depends(get_session), settings: Settings = Depends(get_settings)):
    ip_hash = auth.hash_token(_client_ip(request, settings))
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
    if not _claim(db, row.id, now):
        db.rollback()
        return RedirectResponse(f"/{row.locale}/connexion/lien-expire", status_code=303)
    user = _find_user(db, row.email)
    if user is None:
        user = User(id=str(uuid.uuid4()), email=row.email, locale=row.locale, consent_at=now, created_at=now,
                    role="admin" if row.email in settings.admin_emails else "user")
        try:
            with db.begin_nested():
                db.add(user)
                db.flush()
            db.add(Event(type="signup_completed", occurred_at=now, locale=row.locale))
        except IntegrityError:  # created concurrently: sign in to the existing account
            user = db.scalar(select(User).where(User.email == row.email))
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
