"""Rythme d'un objectif d'épargne."""
from app.domain.months import SAVE_KINDS


def add_months(ym: str, n: int) -> str:
    i = int(ym[:4]) * 12 + int(ym[5:]) - 1 + n
    return f"{i // 12}-{i % 12 + 1:02d}"


def diff_months(a: str, b: str) -> int:
    return (int(b[:4]) - int(a[:4])) * 12 + int(b[5:]) - int(a[5:])


def monthly_saving(months: list, today_ym: str) -> int:
    """Épargne prévue (save + save2) du mois courant, sinon du dernier mois, sinon 0."""
    m = next((x for x in months if x.year_month == today_ym), None) or max(months, key=lambda x: x.year_month, default=None)
    return sum(e["planned"] for e in m.envelopes if e["kind"] in SAVE_KINDS) if m else 0


def goal_pace(goal, monthly_saving: int, today_ym: str) -> dict:
    left = max(0, goal.target - goal.saved)
    needed = -(-left // max(1, diff_months(today_ym, goal.deadline)))
    projected = None if monthly_saving <= 0 else add_months(today_ym, -(-left // monthly_saving))
    return {"monthly_needed": needed, "on_track": monthly_saving >= needed, "projected": projected}
