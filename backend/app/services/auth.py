import hashlib
from datetime import UTC, datetime

SESSION_COOKIE = "sf_session"


def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


def now() -> datetime:
    return datetime.now(UTC)  # tests monkeypatch this to move the clock


def cookie_args(settings) -> dict:
    """The site and the API live on different domains in production: the session cookie must be SameSite=None (so Secure)."""
    prod = settings.env == "production"
    return {"httponly": True, "path": "/", "secure": prod, "samesite": "none" if prod else "lax"}
