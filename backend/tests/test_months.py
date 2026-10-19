from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy import select, update

from app.db.models import Event, Month
from app.domain.months import sun_steps
from app.services import auth as auth_service

SIM = {"income": 500000, "currency": "XOF", "method": "50-30-20", "essentials": 200000, "has_debt": False, "savings": 0}
NOW = datetime(2026, 10, 15, 12, tzinfo=UTC)
YM = "2026-10"


@pytest.fixture(autouse=True)
def clock(monkeypatch):
    t = {"now": NOW}
    monkeypatch.setattr(auth_service, "now", lambda: t["now"])
    return t


def onboard(c, **over):
    r = c.post("/api/onboarding", json={**SIM, **over})
    assert r.status_code == 200, r.text
    return r.json()


def close(c, actuals=(243000, 164000, 93000), ym=YM):
    return c.post(f"/api/months/{ym}/close", json={"actuals": list(actuals), "went_well": "ok", "change_next": None, "helpfulness": 4})


def test_onboarding_creates_current_month_from_simulation(client, login):
    c = login("a@x.com")
    m = onboard(c)
    assert m["year_month"] == YM and m["closed_at"] is None and m["savings_rate_bp"] is None
    assert [e["planned"] for e in m["envelopes"]] == [250000, 150000, 100000]
    assert c.get("/api/me").json()["currency"] == "XOF"


def test_onboarding_is_idempotent(client, login):
    c = login("a@x.com")
    onboard(c)
    onboard(c, income=999)
    assert len(c.get("/api/months").json()) == 1
    assert c.get(f"/api/months/{YM}").json()["income"] == 500000


def test_custom_plan_keeps_labels(client, login):
    c = login("a@x.com")
    m = onboard(c, method="custom", envelopes=[{"kind": "need", "pct": 70, "label": "Loyer"}, {"kind": "save", "pct": 30}])
    assert [(e["label"], e["planned"]) for e in m["envelopes"]] == [("Loyer", 350000), ("save", 150000)]


def test_close_rejects_totals_mismatch(client, login):
    c = login("a@x.com")
    onboard(c)
    r = close(c, (243000, 164000, 90000))
    assert r.status_code == 422 and r.json() == {"detail": "totals_mismatch"}
    assert close(c, (500000,)).status_code == 422


def test_close_ok_computes_rate_and_creates_next_month(client, login):
    c = login("a@x.com")
    onboard(c)
    r = close(c)
    assert r.status_code == 200
    body = r.json()
    assert body["month"]["savings_rate_bp"] == 1860 and body["month"]["kept"] is False
    assert body["previous_rate_bp"] is None and body["steps"] == 1
    nxt = c.get("/api/months/2026-11").json()
    assert nxt["income"] == 500000 and nxt["closed_at"] is None


def test_close_twice_does_not_duplicate_next_month(client, login):
    c = login("a@x.com")
    onboard(c)
    assert close(c).status_code == 200 and close(c).status_code == 200
    assert [m["year_month"] for m in c.get("/api/months").json()] == ["2026-11", YM]
    with client.session_factory() as s:
        assert len(s.scalars(select(Event).where(Event.type == "month_closed")).all()) == 1


def test_reclose_within_7_days_updates(client, login, clock):
    c = login("a@x.com")
    onboard(c)
    first = close(c).json()["month"]["closed_at"]
    clock["now"] = NOW + timedelta(days=6)
    r = close(c, (240000, 160000, 100000))
    assert r.status_code == 200
    assert r.json()["month"]["closed_at"] == first and r.json()["month"]["savings_rate_bp"] == 2000


def test_reclose_after_7_days_is_locked(client, login, clock):
    c = login("a@x.com")
    onboard(c)
    close(c)
    clock["now"] = NOW + timedelta(days=8)
    r = close(c)
    assert r.status_code == 409 and r.json() == {"detail": "locked"}


def test_put_closed_month_conflicts(client, login):
    c = login("a@x.com")
    onboard(c)
    close(c)
    r = c.put(f"/api/months/{YM}", json={"income": 1, "currency": "XOF", "method": "80-20"})
    assert r.status_code == 409 and r.json() == {"detail": "closed"}


def test_put_creates_and_replaces_open_month(client, login):
    c = login("a@x.com")
    r = c.put("/api/months/2026-12", json={"income": 100000, "currency": "XOF", "method": "80-20"})
    assert r.status_code == 200 and [e["planned"] for e in r.json()["envelopes"]] == [80000, 20000]
    r = c.put("/api/months/2026-12", json={"income": 200000, "currency": "XOF", "method": "80-20"})
    assert r.json()["envelopes"][0]["planned"] == 160000


def test_close_unknown_month_is_404(client, login):
    c = login("a@x.com")
    assert close(c, ym="2030-01").status_code == 404


def test_isolation_user_b_cannot_read_or_close_a_month(client, login):
    a = login("a@x.com")
    onboard(a)
    b = login("b@x.com")
    assert b.get(f"/api/months/{YM}").status_code == 404
    assert close(b).status_code == 404
    assert b.get("/api/months").json() == []


def test_month_routes_require_session(client):
    for method, url in [("get", "/api/months"), ("get", f"/api/months/{YM}"), ("post", f"/api/months/{YM}/close"),
                        ("post", "/api/onboarding"), ("put", "/api/profile")]:
        assert getattr(client, method)(url).status_code == 401


def test_put_profile(client, login):
    c = login("a@x.com")
    assert c.put("/api/profile", json={"essentials": 1, "has_debt": True, "savings": 2}).status_code == 200


def test_steps_over_closed_months_and_previous_rate(client, login):
    c = login("a@x.com")
    onboard(c)
    close(c)  # 1860
    r = close(c, (240000, 150000, 110000), ym="2026-11")
    assert r.json()["previous_rate_bp"] == 1860 and r.json()["steps"] == 2


def test_create_race_returns_existing(client, login, monkeypatch):
    # the month appears between the existence check and the insert: no 500, no duplicate
    c = login("a@x.com")
    onboard(c)
    from app.api.routes import months as routes
    real = routes._get
    calls = {"n": 0}

    def stale(db, user, ym):
        calls["n"] += 1
        return None if ym == "2026-11" and calls["n"] == 2 else real(db, user, ym)

    close(c)  # creates 2026-11 normally
    monkeypatch.setattr(routes, "_get", stale)
    assert close(c).status_code == 200
    with client.session_factory() as s:
        assert len(s.scalars(select(Month).where(Month.year_month == "2026-11")).all()) == 1


def test_sun_steps():
    assert sun_steps([]) == 0 and sun_steps([5]) == 1
    assert sun_steps([1, 2, 2, 3]) == 3
    assert sun_steps(list(range(30))) == 12


def test_lost_close_claim_is_a_reclose(client, login, monkeypatch):
    # another request closes the month between our read and our claim: no second event, closed_at unchanged
    c = login("a@x.com")
    onboard(c)
    from app.api.routes import months as routes
    real = routes._claim_close
    other = NOW - timedelta(minutes=5)

    def racing(db, m, now):
        with client.session_factory() as s:
            s.execute(update(Month).where(Month.id == m.id).values(closed_at=other))
            s.commit()
        return real(db, m, now)

    monkeypatch.setattr(routes, "_claim_close", racing)
    r = close(c)
    assert r.status_code == 200
    assert datetime.fromisoformat(r.json()["month"]["closed_at"]).replace(tzinfo=UTC) == other
    with client.session_factory() as s:
        assert s.scalars(select(Event).where(Event.type == "month_closed")).all() == []
