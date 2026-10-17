from datetime import UTC, datetime, timedelta
from urllib.parse import parse_qs, urlparse

import httpx
import pytest
from sqlalchemy import func, select

from app.core.config import Settings, get_settings
from app.db.models import Event, LoginToken, SessionToken, User
from app.main import app
from app.services import auth as auth_service
from app.services import email as email_service
from app.services.auth import SESSION_COOKIE


@pytest.fixture
def sent(monkeypatch):
    """R1: never send real mail; capture (email, link, locale)."""
    calls = []
    monkeypatch.setattr("app.api.routes.auth.send_login_link", lambda e, link, loc, settings: calls.append((e, link, loc)))
    return calls


def request_link(client, email="Ana@Example.com ", **extra):
    body = {"email": email, "locale": "fr", "consent": True, **extra}
    return client.post("/api/auth/request-link", json=body)


def token_of(link: str) -> str:
    return parse_qs(urlparse(link).query)["token"][0]


def verify(client, link):
    return client.get(f"/api/auth/verify?token={token_of(link)}", follow_redirects=False)


def count(client, model):
    with client.session_factory() as s:
        return s.scalar(select(func.count()).select_from(model))


def test_request_link_returns_dev_link_in_development(client, sent):
    r = request_link(client)
    assert r.status_code == 202
    body = r.json()
    assert body["sent"] is True and body["dev_link"] == sent[0][1]
    assert sent[0][0] == "ana@example.com" and sent[0][2] == "fr"
    assert sent[0][1].startswith("http://localhost:3000/api/auth/verify?token=")


def test_no_dev_link_in_production(client, sent):
    app.dependency_overrides[get_settings] = lambda: Settings(_env_file=None, env="production")
    r = request_link(client)
    assert r.status_code == 202 and "dev_link" not in r.json()


def test_request_requires_consent(client, sent):
    assert request_link(client, consent=False).status_code == 422
    assert not sent


@pytest.mark.parametrize("bad", ["//evil.com", "https://evil.com", "evil", "/\\evil.com"])
def test_request_rejects_open_redirect(client, sent, bad):
    assert request_link(client, next=bad).status_code == 422


def test_request_rejects_bad_email(client, sent):
    assert request_link(client, email="nope").status_code == 422
    assert request_link(client, email="a" * 250 + "@b.co").status_code == 422


def test_token_stored_hashed(client, sent):
    request_link(client)
    raw = token_of(sent[0][1])
    with client.session_factory() as s:
        row = s.scalars(select(LoginToken)).one()
        assert row.token_hash == auth_service.hash_token(raw)
        assert raw not in {row.token_hash, row.ip_hash, row.email}


def test_verify_creates_user_session_and_redirects(client, sent):
    request_link(client)
    r = verify(client, sent[0][1])
    assert r.status_code == 303 and r.headers["location"] == "/fr/tableau-de-bord"
    cookie = r.headers["set-cookie"].lower()
    assert f"{SESSION_COOKIE}=" in cookie and "httponly" in cookie and "samesite=lax" in cookie
    assert "max-age=2592000" in cookie and "secure" not in cookie
    with client.session_factory() as s:
        assert s.scalars(select(User)).one().email == "ana@example.com"
        assert s.scalars(select(Event.type)).all() == ["signup_completed"]
    assert count(client, SessionToken) == 1
    assert client.get("/api/me").json()["email"] == "ana@example.com"


def test_verify_honours_next(client, sent):
    request_link(client, next="/fr/suivi")
    assert verify(client, sent[0][1]).headers["location"] == "/fr/suivi"


def test_verify_twice_goes_to_expired(client, sent):
    request_link(client)
    verify(client, sent[0][1])
    r = verify(client, sent[0][1])
    assert r.status_code == 303 and r.headers["location"] == "/fr/connexion/lien-expire"


def test_verify_unknown_token_goes_to_expired_fr(client):
    r = client.get("/api/auth/verify?token=zzz", follow_redirects=False)
    assert r.status_code == 303 and r.headers["location"] == "/fr/connexion/lien-expire"


def test_verify_after_15_minutes_goes_to_expired(client, sent, monkeypatch):
    request_link(client, locale="en")
    t = datetime.now(UTC) + timedelta(minutes=16)
    monkeypatch.setattr(auth_service, "now", lambda: t)
    r = verify(client, sent[0][1])
    assert r.headers["location"] == "/en/connexion/lien-expire"
    assert SESSION_COOKIE not in r.headers.get("set-cookie", "")


def test_rate_limit_email(client, sent):
    for _ in range(5):
        assert request_link(client).status_code == 202
    r = request_link(client)
    assert r.status_code == 429
    assert r.json()["detail"] == "rate_limited" and 1 <= r.json()["retry_after"] <= 3600
    assert len(sent) == 5


def test_rate_limit_ip(client, sent):
    for i in range(20):
        assert request_link(client, email=f"u{i}@example.com").status_code == 202
    assert request_link(client, email="u99@example.com").status_code == 429


def test_rate_limit_window_expires(client, sent, monkeypatch):
    for _ in range(5):
        request_link(client)
    t = datetime.now(UTC) + timedelta(hours=1, seconds=5)
    monkeypatch.setattr(auth_service, "now", lambda: t)
    assert request_link(client).status_code == 202


def test_email_failure_is_502(client, monkeypatch):
    def boom(*a):
        raise email_service.EmailError("x")

    monkeypatch.setattr("app.api.routes.auth.send_login_link", boom)
    r = request_link(client)
    assert r.status_code == 502 and r.json() == {"detail": "email_failed"}


def test_resend_http_call(monkeypatch):
    seen = {}

    def fake_post(url, **kw):
        seen.update(url=url, **kw)
        return httpx.Response(200, request=httpx.Request("POST", url))

    monkeypatch.setattr(email_service.httpx, "post", fake_post)
    s = Settings(_env_file=None, resend_api_key="k")
    email_service.send_login_link("a@b.co", "http://x/l?token=t", "en", s)
    assert seen["url"] == "https://api.resend.com/emails" and seen["headers"]["Authorization"] == "Bearer k"
    j = seen["json"]
    assert j["to"] == ["a@b.co"] and j["subject"] == "Your Soon Finance sign-in link"
    assert "http://x/l?token=t" in j["html"] and "valid for 15 minutes" in j["text"]
    assert seen["timeout"] == 10

    def fail(url, **kw):
        raise httpx.ConnectError("down")

    monkeypatch.setattr(email_service.httpx, "post", fail)
    with pytest.raises(email_service.EmailError):
        email_service.send_login_link("a@b.co", "l", "fr", s)


def test_dev_mode_logs_link_without_key(caplog, monkeypatch):
    monkeypatch.setattr(email_service.log, "disabled", False)  # alembic fileConfig disables existing loggers
    caplog.set_level("INFO")
    email_service.send_login_link("a@b.co", "http://x/l?token=t", "fr", Settings(_env_file=None))
    assert "http://x/l?token=t" in caplog.text


def test_me_requires_session(client):
    r = client.get("/api/me")
    assert r.status_code == 401 and r.json() == {"detail": "unauthenticated"}


def test_expired_session_rejected_and_deleted(client, login):
    login("a@b.co")
    with client.session_factory() as s:
        s.scalars(select(SessionToken)).one().expires_at = datetime.now(UTC) - timedelta(seconds=1)
        s.commit()
    assert client.get("/api/me").status_code == 401
    assert count(client, SessionToken) == 0


def test_logout_clears_session(client, login):
    login("a@b.co")
    assert client.post("/api/auth/logout").status_code == 204
    assert count(client, SessionToken) == 0
    assert client.get("/api/me").status_code == 401


def test_existing_user_signs_in_without_duplicate(client, sent):
    for _ in range(2):
        request_link(client)
        verify(client, sent[-1][1])
    assert count(client, User) == 1 and count(client, Event) == 1 and count(client, SessionToken) == 2
