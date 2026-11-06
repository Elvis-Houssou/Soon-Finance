from datetime import UTC, datetime

from app.services import auth as auth_service

NOW = datetime(2026, 10, 15, 12, tzinfo=UTC)
SIM = {"income": 500000, "currency": "XOF", "method": "50-30-20", "essentials": 200000, "has_debt": False, "savings": 0}


def test_monthly_review_requires_auth(client):
    assert client.get("/api/monthly-review").status_code == 401


def test_monthly_review_handles_no_closed_data(client, login):
    body = login("review@example.com").get("/api/monthly-review").json()
    assert body["available"] is False
    assert body["reason"] == "no_closed_months"
    assert body["insights"] == []


def test_monthly_review_reports_actuals_and_changes(client, login, monkeypatch):
    monkeypatch.setattr(auth_service, "now", lambda: NOW)
    c = login("review@example.com")
    for ym, actuals in [
        ("2026-08", [250000, 150000, 100000]),
        ("2026-09", [270000, 140000, 90000]),
    ]:
        assert c.put(f"/api/months/{ym}", json={k: SIM[k] for k in ("income", "currency", "method")}).status_code == 200
        assert c.post(f"/api/months/{ym}/close", json={"actuals": actuals}).status_code == 200
    body = c.get("/api/monthly-review").json()
    assert body["available"] is True and body["months_analyzed"] == 2
    assert body["current"]["year_month"] == "2026-09"
    assert body["current"]["saved"] == 90000
    assert body["current"]["spending"] == 410000
    assert {item["metric"] for item in body["changes"]} == {"income", "spending", "saved", "savings_rate_bp"}
    assert body["insights"][0]["id"] == "envelope_over_budget"
    assert body["insights"][0]["amount"] == 20000


def test_monthly_review_does_not_compare_different_currencies(client, login, monkeypatch):
    monkeypatch.setattr(auth_service, "now", lambda: NOW)
    c = login("currency-review@example.com")
    for ym, currency in [("2026-08", "EUR"), ("2026-09", "XOF")]:
        assert c.put(f"/api/months/{ym}", json={"income": 500000, "currency": currency, "method": "50-30-20"}).status_code == 200
        assert c.post(f"/api/months/{ym}/close", json={"actuals": [250000, 150000, 100000]}).status_code == 200
    body = c.get("/api/monthly-review").json()
    assert body["previous"] is None and body["changes"] == []
