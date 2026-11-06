"""Analyse déterministe des mois clôturés. Aucun conseil n'est produit sans données observées."""
from app.domain.months import SAVE_KINDS, rate_bp


def monthly_review(months: list) -> dict:
    closed = sorted((m for m in months if m.closed_at is not None), key=lambda m: m.year_month)
    if not closed:
        return {"available": False, "reason": "no_closed_months", "months_analyzed": 0, "current": None, "previous": None, "changes": [], "insights": []}
    current = closed[-1]
    previous = next((m for m in reversed(closed[:-1]) if m.currency == current.currency), None)
    saved = sum(e["actual"] or 0 for e in current.envelopes if e["kind"] in SAVE_KINDS)
    spent = sum(e["actual"] or 0 for e in current.envelopes if e["kind"] not in SAVE_KINDS)
    current_rate = rate_bp(current.income, current.envelopes)
    changes = []
    if previous:
        previous_saved = sum(e["actual"] or 0 for e in previous.envelopes if e["kind"] in SAVE_KINDS)
        previous_spent = sum(e["actual"] or 0 for e in previous.envelopes if e["kind"] not in SAVE_KINDS)
        changes = [
            {"metric": "income", "current": current.income, "previous": previous.income, "delta": current.income - previous.income},
            {"metric": "spending", "current": spent, "previous": previous_spent, "delta": spent - previous_spent},
            {"metric": "saved", "current": saved, "previous": previous_saved, "delta": saved - previous_saved},
            {"metric": "savings_rate_bp", "current": current_rate, "previous": rate_bp(previous.income, previous.envelopes), "delta": current_rate - rate_bp(previous.income, previous.envelopes)},
        ]
    insights = []
    overspent = [e for e in current.envelopes if e["actual"] is not None and e["actual"] > e["planned"] and e["kind"] not in SAVE_KINDS]
    if overspent:
        worst = max(overspent, key=lambda e: e["actual"] - e["planned"])
        insights.append({"id": "envelope_over_budget", "envelope": worst["label"], "amount": worst["actual"] - worst["planned"], "kind": "observation"})
    if saved == 0:
        insights.append({"id": "no_savings_recorded", "kind": "observation"})
    elif current_rate >= 2000:
        insights.append({"id": "savings_rate_at_least_20_percent", "rate_bp": current_rate, "kind": "positive_observation"})
    if previous and spent > sum(e["actual"] or 0 for e in previous.envelopes if e["kind"] not in SAVE_KINDS):
        insights.append({"id": "spending_increased", "kind": "observation"})
    return {
        "available": True, "reason": None, "months_analyzed": len(closed),
        "current": {"year_month": current.year_month, "currency": current.currency, "income": current.income,
                    "spending": spent, "saved": saved, "savings_rate_bp": current_rate,
                    "envelopes": [{"label": e["label"], "kind": e["kind"], "planned": e["planned"], "actual": e["actual"],
                                   "delta": (e["actual"] or 0) - e["planned"]} for e in current.envelopes]},
        "previous": {"year_month": previous.year_month, "currency": previous.currency} if previous else None,
        "changes": changes, "insights": insights,
    }
