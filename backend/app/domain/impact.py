"""Tableau d'impact : agrégats anonymes uniquement.

Règle de vie privée : tout chiffre calculé sur moins de MIN_GROUP personnes distinctes (utilisateurs, ou anon_id pour
les événements) vaut None. Choix là où le cahier des charges est muet :
- fenêtre `days` : les événements d'usage et les inscrits sont comptés dans la fenêtre ; épargne et montants utilisent
  les mois clôturés (closed_at) dans la fenêtre ; les cohortes sont les mois d'inscription dans la fenêtre.
- les comptes admin (ADMIN_EMAILS) sont exclus de tous les agrégats.
- filtre devise : mois de cette devise (épargne/montants) et utilisateurs dont la devise est celle-ci (inscrits/cohortes).
- anti-différence : si une cohorte est masquée, le total des inscrits (et la conversion) l'est aussi, sinon
  total - somme des lignes visibles révélerait la petite cohorte. NON couvert : la différence entre deux requêtes
  aux filtres différents (ex. « toutes devises » moins « XOF ») ; chaque requête reste sûre, pas leur combinaison.
"""
import statistics
from collections import defaultdict
from datetime import datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models import Event, Month, User
from app.domain.months import SAVE_KINDS, next_ym, rate_bp

MIN_GROUP = 5
EVENT_TYPES = {"simulations": "simulation_completed", "comparisons": "comparison_viewed", "signups_started": "signup_started"}


def _ok(n: int) -> bool:
    return n >= MIN_GROUP


def _saved(m: Month) -> int:
    return sum(e.get("actual") or 0 for e in m.envelopes if e["kind"] in SAVE_KINDS)


def compute(db: Session, now: datetime, days: int, currency: str | None, locale: str | None, admin_emails: list[str]) -> dict:
    since = now - timedelta(days=days)
    admins = [e.lower() for e in admin_emails]

    # --- Utilisation (événements) ---
    usage: dict = {}
    for key, etype in EVENT_TYPES.items():
        q = select(func.count(Event.id), func.count(func.distinct(Event.anon_id))).where(Event.type == etype, Event.occurred_at >= since)
        if currency:
            q = q.where(Event.currency == currency)
        if locale:
            q = q.where(Event.locale == locale)
        total, anons = db.execute(q).one()
        usage[key] = total if _ok(anons) else None

    # --- Utilisateurs de la portée (hors admins) ---
    base = select(User).where(func.lower(User.email).notin_(admins))
    if locale:
        base = base.where(User.locale == locale)
    scope_ids = {u.id for u in db.scalars(base)}  # le filtre devise des mois porte sur Month.currency
    users = db.scalars(base.where(User.currency == currency) if currency else base).all()

    # --- Cohortes ---
    closed_all: dict[str, int] = defaultdict(int)
    for uid, n in db.execute(select(Month.user_id, func.count(Month.id)).where(Month.closed_at.is_not(None)).group_by(Month.user_id)):
        closed_all[uid] = n
    cohorts: dict[str, list[User]] = defaultdict(list)
    for u in users:
        if u.created_at >= since:
            cohorts[u.created_at.strftime("%Y-%m")].append(u)
    now_ym = now.strftime("%Y-%m")
    retention = []
    for ym in sorted(cohorts):
        members = cohorts[ym]
        row: dict = {"cohort": ym, "users": len(members) if _ok(len(members)) else None, "m1_bp": None, "m2_bp": None, "m3_bp": None}
        if _ok(len(members)):
            for n in (1, 2, 3):
                end = ym
                for _ in range(n - 1):
                    end = next_ym(end)
                if end < now_ym:  # le N-ième mois n'est mesurable qu'une fois terminé
                    row[f"m{n}_bp"] = sum(closed_all[u.id] >= n for u in members) * 10000 // len(members)
        retention.append(row)
    hidden_cohort = any(not _ok(len(m)) for m in cohorts.values())
    signups = sum(len(m) for m in cohorts.values())
    usage["signups_completed"] = signups if _ok(signups) and not hidden_cohort else None
    sims = usage["simulations"]
    usage["conversion_bp"] = usage["signups_completed"] * 10000 // sims if sims and usage["signups_completed"] is not None else None

    # --- Épargne réelle (mois clôturés dans la fenêtre) ---
    mq = select(Month).where(Month.closed_at.is_not(None), Month.closed_at >= since, Month.user_id.in_(scope_ids))
    if currency:
        mq = mq.where(Month.currency == currency)
    months = db.scalars(mq).all()
    by_user: dict[str, list[Month]] = defaultdict(list)
    for m in months:
        by_user[m.user_id].append(m)

    median = statistics.median_low([rate_bp(m.income, m.envelopes) for m in months]) if _ok(len(by_user)) else None
    multi = [sorted(ms, key=lambda m: m.year_month) for ms in by_user.values() if len(ms) >= 2]
    improved = (
        sum(rate_bp(ms[-1].income, ms[-1].envelopes) > rate_bp(ms[0].income, ms[0].envelopes) for ms in multi) * 10000 // len(multi)
        if _ok(len(multi)) else None
    )
    rated = [m for m in months if m.helpfulness is not None]
    help_users = len({m.user_id for m in rated})
    helpfulness = sum(m.helpfulness for m in rated) * 100 // len(rated) if _ok(help_users) else None

    totals: dict[str, int] = defaultdict(int)
    holders: dict[str, set[str]] = defaultdict(set)
    for m in months:
        totals[m.currency] += _saved(m)
        holders[m.currency].add(m.user_id)
    amounts = [{"currency": c, "saved_total": totals[c] if _ok(len(holders[c])) else None} for c in sorted(totals)]

    return {
        "usage": usage,
        "retention": retention,
        "savings": {"median_rate_bp": median, "improved_share_bp": improved, "helpfulness_avg_x100": helpfulness},
        "amounts": amounts,
        "min_group": MIN_GROUP,
    }
