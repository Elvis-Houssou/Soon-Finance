from datetime import UTC, datetime

import pytest

from app.services import auth as auth_service

NOW = datetime(2026, 10, 15, 12, tzinfo=UTC)
SIM = {"income": 500000, "currency": "XOF", "method": "50-30-20", "essentials": 200000, "has_debt": False, "savings": 0}


@pytest.fixture(autouse=True)
def clock(monkeypatch):
    monkeypatch.setattr(auth_service, "now", lambda: NOW)


def close_month(c, ym, actuals):
    plan = {k: SIM[k] for k in ("income", "currency", "method")}
    assert c.put(f"/api/months/{ym}", json=plan).status_code == 200
    r = c.post(f"/api/months/{ym}/close", json={"actuals": actuals})
    assert r.status_code == 200, r.text


def ids(c):
    return [s["id"] for s in c.get("/api/dashboard").json()["suggestions"]]


def test_dashboard_empty_user(client, login):
    d = login("a@x.com").get("/api/dashboard").json()
    assert d["current_month"] is None and d["steps"] == 0 and d["suggestions"] == [] and d["goals"] == []
    assert d["closed_count"] == 0 and d["rates"] == [] and d["saved_total"] == 0


def test_dashboard_full(client, login):
    c = login("a@x.com")
    c.post("/api/onboarding", json=SIM)
    for ym, s in (("2026-07", 60000), ("2026-08", 85000), ("2026-09", 93000)):
        close_month(c, ym, [350000 - s, 150000, s])
    d = c.get("/api/dashboard").json()
    assert d["steps"] == 3 and d["saved_total"] == 238000 and d["closed_count"] == 3
    assert [r["savings_rate_bp"] for r in d["rates"]] == [1200, 1700, 1860]
    assert d["current_month"]["year_month"] == "2026-10"


def test_rule_6_two_months_overspent(client, login):
    c = login("a@x.com")
    for ym in ("2026-08", "2026-09"):
        close_month(c, ym, [260000, 150000, 90000])
    s = [x for x in c.get("/api/dashboard").json()["suggestions"] if x["id"] == "envelope-overspent"]
    assert len(s) == 1 and "key" in s[0]["params"]


def test_rule_7_three_months_kept(client, login):
    c = login("a@x.com")
    for ym in ("2026-07", "2026-08"):
        close_month(c, ym, [250000, 150000, 100000])
    assert "increase-savings" not in ids(c)
    close_month(c, "2026-09", [250000, 150000, 100000])
    assert "increase-savings" in ids(c)


def test_rule_9_previous_not_closed(client, login):
    c = login("a@x.com")
    close_month(c, "2026-08", [250000, 150000, 100000])  # creates 2026-09, left open
    d = c.get("/api/dashboard").json()
    s = [x for x in d["suggestions"] if x["id"] == "close-previous-month"]
    assert s[0]["params"] == {"year_month": "2026-09"}


def test_rule_8_goal_behind_and_plan1_rules(client, login):
    c = login("a@x.com")
    c.post("/api/onboarding", json={**SIM, "essentials": 450000})
    c.post("/api/goals", json={"label": "V", "target": 1_500_000, "deadline": "2027-06", "saved": 145_000})
    s = c.get("/api/dashboard").json()["suggestions"]
    assert [x["id"] for x in s][0] == "essentials-not-covered"
    g = next(x for x in s if x["id"] == "goal-behind")
    assert g["params"]["monthly_needed"] == 169_375 and g["params"]["projected"] == "2027-12"
