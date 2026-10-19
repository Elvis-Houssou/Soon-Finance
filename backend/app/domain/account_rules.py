"""Règles 6 à 9 des suggestions, calculées sur le suivi du compte."""
from app.domain.months import kept
from app.domain.progress import add_months, goal_pace, monthly_saving
from app.schemas.simulation import Suggestion


def _over(m) -> set[str]:
    return {e["label"] for e in m.envelopes if e["actual"] > e["planned"]}


def account_suggestions(months: list, goals: list, today_ym: str) -> list[Suggestion]:
    closed = sorted((m for m in months if m.closed_at is not None), key=lambda m: m.year_month)
    out: list[Suggestion] = []
    if len(closed) >= 2:
        out += [Suggestion(id="envelope-overspent", params={"key": k}) for k in sorted(_over(closed[-2]) & _over(closed[-1]))]
    if len(closed) >= 3 and all(kept(m.envelopes) for m in closed[-3:]):
        out.append(Suggestion(id="increase-savings"))
    rhythm = monthly_saving(months, today_ym)
    for g in goals:
        p = goal_pace(g, rhythm, today_ym)
        if not p["on_track"]:
            params = {"goal_id": g.id, "monthly_needed": p["monthly_needed"]}
            if p["projected"]:
                params["projected"] = p["projected"]
            out.append(Suggestion(id="goal-behind", params=params))
    prev = add_months(today_ym, -1)
    if any(m.year_month == prev and m.closed_at is None for m in months):
        out.append(Suggestion(id="close-previous-month", params={"year_month": prev}))
    return out
