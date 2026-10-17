import hashlib

SESSION_COOKIE = "sf_session"


def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()
