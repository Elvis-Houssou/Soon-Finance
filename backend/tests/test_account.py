from sqlalchemy import func, select

from app.db.models import Goal, LoginToken, Month, Profile, SessionToken, User
from app.services.auth import SESSION_COOKIE

G = {"label": "Voiture", "target": 1_500_000, "deadline": "2099-06", "saved": 5}


def _seed(c):
    c.post("/api/goals", json=G)
    with c.session_factory() as s:
        s.add(Profile(user_id=s.scalar(select(User.id).order_by(User.created_at.desc())), essentials=100, has_debt=False, savings=5))
        s.commit()


def test_patch_me_changes_currency_without_conversion(client, login):
    c = login("a@x.com")
    with client.session_factory() as s:
        u = s.scalar(select(User))
        s.add(Month(id="m1", user_id=u.id, year_month="2026-10", income=1000, currency="XOF", method="50-30-20",
                    envelopes=[], created_at=u.created_at))
        s.commit()
    r = c.patch("/api/me", json={"first_name": "Ada", "locale": "en", "currency": "EUR"})
    assert r.status_code == 200 and r.json()["currency"] == "EUR" and r.json()["first_name"] == "Ada"
    assert c.patch("/api/me", json={"first_name": None, "locale": "fr", "currency": "XOF"}).json()["first_name"] is None
    assert c.patch("/api/me", json={"first_name": "x" * 41, "locale": "fr", "currency": "XOF"}).status_code == 422
    assert c.patch("/api/me", json={"first_name": "A", "locale": "fr", "currency": "ZZZ"}).status_code == 422
    with client.session_factory() as s:
        m = s.scalar(select(Month))
        assert (m.income, m.currency) == (1000, "XOF")


def test_export_contains_all_user_data_only(client, login):
    login("b@x.com").post("/api/goals", json={**G, "label": "SecretB"})
    c = login("a@x.com")
    _seed(c)
    r = c.get("/api/me/export")
    assert r.status_code == 200
    assert r.headers["content-disposition"] == 'attachment; filename="soon-finance-export.json"'
    d = r.json()
    assert set(d) == {"user", "profile", "months", "goals"} and d["profile"]["essentials"] == 100
    assert d["user"]["email"] == "a@x.com" and [g["label"] for g in d["goals"]] == ["Voiture"]
    assert "SecretB" not in r.text and "b@x.com" not in r.text


def test_delete_me_removes_everything_and_session(client, login):
    c = login("a@x.com")
    _seed(c)
    with client.session_factory() as s:
        s.add(LoginToken(id="t", email="a@x.com", token_hash="h", locale="fr", ip_hash="i",
                         expires_at=s.scalar(select(User.created_at)), created_at=s.scalar(select(User.created_at))))
        s.commit()
    r = c.delete("/api/me")
    assert r.status_code == 204 and SESSION_COOKIE in r.headers["set-cookie"]
    assert c.get("/api/me").status_code == 401
    with client.session_factory() as s:
        for model in (User, SessionToken, LoginToken, Goal, Month, Profile):
            assert s.scalar(select(func.count()).select_from(model)) == 0
