import hashlib
from datetime import UTC, datetime

SESSION_COOKIE = "sf_session"


def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


def now() -> datetime:
    return datetime.now(UTC)  # tests monkeypatch this to move the clock
