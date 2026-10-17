from typing import Annotated

from fastapi import Cookie, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.models import SessionToken, User
from app.db.session import get_session
from app.services import auth


def current_user(
    raw: Annotated[str | None, Cookie(alias=auth.SESSION_COOKIE)] = None,
    db: Session = Depends(get_session),
) -> User:
    unauth = HTTPException(401, "unauthenticated")
    if not raw:
        raise unauth
    row = db.get(SessionToken, auth.hash_token(raw))  # primary-key lookup on the hash
    if row is None:
        raise unauth
    if row.expires_at <= auth.now():
        db.delete(row)
        db.commit()
        raise unauth
    user = db.get(User, row.user_id)
    if user is None:
        raise unauth
    return user
