from fastapi.testclient import TestClient

from soonfinance.main import app
from soonfinance.suggestions import SimulationIn, suggest

client = TestClient(app)


def sim(method="50-30-20", **kw):
    return SimulationIn(income=500000, currency="XOF", method=method, **kw)


def ids(s):
    return [x.id for x in suggest(s)]


def test_soon_model_not_covering_essentials():
    out = suggest(sim("soon-10-70-20", essentials=300000))
    assert out[0].id == "essentials-not-covered"
    assert out[0].params == {"live": 100000, "essentials": 300000}


def test_50_30_20_covers_essentials():
    assert "essentials-not-covered" not in ids(sim(essentials=300000))


def test_debt_first_and_no_investing():
    got = ids(sim(has_debt=True, essentials=100000, savings=900000))
    assert "repay-debt-first" in got and "learn-investing" not in got


def test_emergency_fund_bounds():
    out = {x.id: x for x in suggest(sim(essentials=300000, savings=100000))}
    assert out["build-emergency-fund"].params == {"min": 900000, "max": 1800000}


def test_start_saving_10():
    envs = [{"kind": "need", "pct": 95}, {"kind": "save", "pct": 5}]
    assert "start-saving-10" in ids(sim("custom", envelopes=envs))


def test_learn_investing():
    got = ids(sim(essentials=100000, savings=300000, has_debt=False))
    assert "learn-investing" in got and "build-emergency-fund" not in got


def test_no_optional_answers():
    assert ids(sim()) == []


def test_order_is_priority():
    got = ids(sim("soon-10-70-20", essentials=300000, has_debt=True, savings=0))
    assert got == ["essentials-not-covered", "repay-debt-first", "build-emergency-fund"]


BASE = {"income": 500000, "currency": "XOF", "method": "50-30-20"}


def post(**kw):
    return client.post("/api/suggestions", json={**BASE, **kw})


def test_api_ok():
    r = post(essentials=300000, has_debt=True)
    assert r.status_code == 200
    assert r.json() == {"suggestions": [{"id": "repay-debt-first", "params": {}}]}


def test_api_rejects_custom_total_95():
    envs = [{"kind": "need", "pct": 90}, {"kind": "save", "pct": 5}]
    assert post(method="custom", envelopes=envs).status_code == 422


def test_api_rejects_custom_without_envelopes():
    assert post(method="custom").status_code == 422


def test_api_rejects_unknown_currency():
    assert post(currency="XXX").status_code == 422


def test_api_rejects_negative_income():
    assert post(income=-1).status_code == 422


def test_api_rejects_bad_types_and_method():
    assert post(has_debt=1).status_code == 422
    assert post(income=1.5).status_code == 422
    assert post(method="nope").status_code == 422
    assert post(extra=1).status_code == 422


def test_api_rejects_essentials_and_savings_over_cap():
    assert post(essentials=1_000_000_000_001).status_code == 422
    assert post(savings=1_000_000_000_001).status_code == 422
