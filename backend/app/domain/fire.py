"""Simulateur FIRE pédagogique : projections déterministes, non garanties."""
from dataclasses import dataclass


@dataclass(frozen=True)
class Scenario:
    name: str
    annual_nominal_return_pct: float


SCENARIOS = (
    Scenario("zero_return", 0.0),
    Scenario("conservative", 3.0),
    Scenario("moderate", 5.0),
    Scenario("optimistic", 7.0),
)


def real_annual_return(nominal_pct: float, inflation_pct: float) -> float:
    nominal = nominal_pct / 100
    inflation = inflation_pct / 100
    return (1 + nominal) / (1 + inflation) - 1


def future_value(current_capital: int, monthly_contribution: int, months: int, real_rate: float) -> float:
    if months <= 0:
        return float(current_capital)
    monthly_rate = (1 + real_rate) ** (1 / 12) - 1
    if abs(monthly_rate) < 1e-12:
        return current_capital + monthly_contribution * months
    factor = (1 + monthly_rate) ** months
    return current_capital * factor + monthly_contribution * ((factor - 1) / monthly_rate)


def fire_projection(*, age: int, target_age: int, monthly_expenses: int, current_capital: int,
                    monthly_contribution: int, inflation_pct: float, withdrawal_rate_pct: float) -> dict:
    years = target_age - age
    months = years * 12
    annual_expenses_today = monthly_expenses * 12
    # Target is expressed in today's purchasing power. Contributions/capital are
    # projected in real terms after inflation adjustment.
    target_capital = annual_expenses_today / (withdrawal_rate_pct / 100)
    scenarios = []
    for scenario in SCENARIOS:
        real_rate = real_annual_return(scenario.annual_nominal_return_pct, inflation_pct)
        projected = future_value(current_capital, monthly_contribution, months, real_rate)
        scenarios.append({
            "id": scenario.name,
            "nominal_return_pct": scenario.annual_nominal_return_pct,
            "real_return_pct": round(real_rate * 100, 3),
            "projected_capital": round(projected),
            "target_reached": projected >= target_capital,
        })
    return {
        "years_to_target": years,
        "months_to_target": months,
        "annual_expenses_today": annual_expenses_today,
        "target_capital_today": round(target_capital),
        "required_monthly_contribution_at_zero_return": max(0, -(-(round(target_capital - current_capital)) // max(1, months))),
        "scenarios": scenarios,
        "assumptions": {
            "inflation_pct": inflation_pct,
            "withdrawal_rate_pct": withdrawal_rate_pct,
            "currency_basis": "today",
        },
    }
