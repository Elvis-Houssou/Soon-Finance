from datetime import UTC, datetime
from types import SimpleNamespace

import pytest

from app.domain.months import sun_steps
from app.domain.progress import goal_pace
from app.services import auth as auth_service

NOW = datetime(2026, 10, 15, 12, tzinfo=UTC)
G = {"label": "Voiture", "target": 1_500_000, "deadline": "2027-06", "saved": 145_000}


@pytest.fixture(autouse=True)
def clock(monkeypatch):
    monkeypatch.setattr(auth_service, "now", lambda: NOW)


def test_sun_steps():
    assert sun_steps([]) == 0
    assert sun_steps([1200]) == 1
    assert sun_steps([1200, 1700, 1860]) == 3
    assert sun_steps([1200, 1000, 1700]) == 2


def test_goal_pace_behind():
    p = goal_pace(SimpleNamespace(target=1_500_000, saved=145_000, deadline="2027-06"), 100_000, "2026-10")
    assert p == {"monthly_needed": 169_375, "on_track": False, "projected": "2027-12"}
    assert goal_pace(SimpleNamespace(target=10, saved=0, deadline="2026-10"), 0, "2026-10")["projected"] is None


def test_goal_limit_3(client, login):
    c = login("a@x.com")
    for _ in range(3):
        assert c.post("/api/goals", json=G).status_code == 201
    r = c.post("/api/goals", json=G)
    assert r.status_code == 409 and r.json() == {"detail": "limit"}


def test_goal_crud_and_validation(client, login):
    c = login("a@x.com")
    assert c.post("/api/goals", json={**G, "deadline": "2026-09"}).status_code == 422
    assert c.post("/api/goals", json={**G, "target": 0}).status_code == 422
    assert c.post("/api/goals", json={**G, "label": "x" * 61}).status_code == 422
    g = c.post("/api/goals", json=G).json()
    assert g["pace"]["monthly_needed"] == 169_375 and g["pace"]["projected"] is None
    assert c.patch(f"/api/goals/{g['id']}", json={"saved": 1_500_000}).json()["pace"]["on_track"] is True
    assert c.delete(f"/api/goals/{g['id']}").status_code == 204
    assert c.get("/api/goals").json() == []


def test_goal_isolation(client, login):
    gid = login("a@x.com").post("/api/goals", json=G).json()["id"]
    c = login("b@x.com")
    assert c.patch(f"/api/goals/{gid}", json={"saved": 1}).status_code == 404
    assert c.delete(f"/api/goals/{gid}").status_code == 404
    assert c.get("/api/goals").json() == []
