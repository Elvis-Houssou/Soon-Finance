import pytest

from app.domain.fire import fire_projection, future_value, real_annual_return


def test_real_return_accounts_for_inflation():
    assert real_annual_return(5, 2) == pytest.approx(0.0294117647)
    assert real_annual_return(2, 2) == pytest.approx(0)


def test_future_value_zero_return():
    assert future_value(100000, 10000, 12, 0) == 220000


def test_fire_projection_uses_real_today_currency_and_scenarios():
    result = fire_projection(age=30, target_age=50, monthly_expenses=300000, current_capital=1000000,
                             monthly_contribution=100000, inflation_pct=2, withdrawal_rate_pct=4)
    assert result["target_capital_today"] == 90000000
    assert result["months_to_target"] == 240
    assert result["required_monthly_contribution_at_zero_return"] == 370834
    assert [item["id"] for item in result["scenarios"]] == ["zero_return", "conservative", "moderate", "optimistic"]
    assert result["scenarios"][0]["projected_capital"] == 25000000
    assert result["assumptions"]["currency_basis"] == "today"


def test_fire_input_validation(client):
    assert client.post("/api/fire/simulate", json={"age": 30, "target_age": 30, "monthly_expenses": 1,
        "current_capital": 0, "monthly_contribution": 0}).status_code == 422
    assert client.post("/api/fire/simulate", json={"age": 30, "target_age": 50, "monthly_expenses": 0,
        "current_capital": 0, "monthly_contribution": 0}).status_code == 422


def test_fire_endpoint_is_public_and_returns_scenarios(client):
    response = client.post("/api/fire/simulate", json={"age": 30, "target_age": 50, "monthly_expenses": 300000,
        "current_capital": 1000000, "monthly_contribution": 100000})
    assert response.status_code == 200
    assert len(response.json()["scenarios"]) == 4
