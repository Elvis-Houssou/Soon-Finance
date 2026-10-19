"""Tableau d'impact : agrégats anonymes uniquement.

Règle de vie privée : tout chiffre calculé sur moins de MIN_GROUP personnes distinctes (utilisateurs, ou anon_id pour
les événements) vaut None. Choix là où le cahier des charges est muet :
- fenêtre `days` : les événements d'usage et les inscrits sont comptés dans la fenêtre ; épargne et montants utilisent
  les mois clôturés (closed_at) dans la fenêtre ; les cohortes sont les mois d'inscription dans la fenêtre.
- les comptes admin (ADMIN_EMAILS) sont exclus de tous les agrégats.
- filtre devise : mois de cette devise (épargne/montants) et utilisateurs dont la devise est celle-ci (inscrits/cohortes).
- anti-différence : si une cohorte est masquée, le total des inscrits (et la conversion) l'est aussi, sinon
  total - somme des lignes visibles révélerait la petite cohorte. NON couvert : la différence entre deux requêtes
  aux filtres différents entre eux : un seul filtre à la fois (422 sinon), donc seul « tous » moins « filtré » existe.
- fenêtres emboîtées : 90 j et 365 j appliquent la même règle contre chaque fenêtre plus courte (écart de personnes 0 ou >= 5).
- règle du complément : avec un filtre devise/langue, chaque chiffre n'est affiché que si la population complémentaire
  (tout − filtré) pour ce chiffre vaut 0 ou au moins 5 personnes ; sinon « tout » moins « filtré » révélerait un petit groupe.
- cohortes : le début de fenêtre est ramené au 1er du mois, donc une ligne de cohorte est identique d'une période à l'autre.
- médiane et moyenne de notes : une valeur par utilisateur (dernier taux clôturé de la fenêtre ; sa note moyenne), puis
  médiane/moyenne entre utilisateurs, pour qu'un utilisateur très actif ne pèse pas davantage.
"""
import statistics
from fractions import Fraction
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


def _raw(db: Session, now: datetime, days: int, currency: str | None, locale: str | None, admins: list[str]) -> dict:
    """Chiffres bruts (non masqués) et nombre de personnes derrière chacun."""
    since = now - timedelta(days=days)
    cohort_start = since.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    events = {}
    for key, etype in EVENT_TYPES.items():
        q = select(func.count(Event.id), func.count(func.distinct(Event.anon_id))).where(Event.type == etype, Event.occurred_at >= since)
        if currency:
            q = q.where(Event.currency == currency)
        if locale:
            q = q.where(Event.locale == locale)
        events[key] = tuple(db.execute(q).one())  # (total, anon_id distincts)

    base = select(User).where(func.lower(User.email).notin_(admins))
    if locale:
        base = base.where(User.locale == locale)
    scope = base.with_only_columns(User.id)  # le filtre devise des mois porte sur Month.currency
    users = db.scalars(base.where(User.currency == currency) if currency else base).all()

    closed_all: dict[str, int] = defaultdict(int)
    for uid, n in db.execute(select(Month.user_id, func.count(Month.id)).where(Month.closed_at.is_not(None)).group_by(Month.user_id)):
        closed_all[uid] = n
    cohorts: dict[str, list[User]] = defaultdict(list)
    for u in users:
        if u.created_at >= cohort_start:
            cohorts[u.created_at.strftime("%Y-%m")].append(u)
    now_ym = now.strftime("%Y-%m")
    rows = {}
    for ym, members in cohorts.items():
        ms = []
        for n in (1, 2, 3):
            end = ym
            for _ in range(n - 1):
                end = next_ym(end)
            # le N-ième mois n'est mesurable qu'une fois terminé
            ms.append(sum(closed_all[u.id] >= n for u in members) * 10000 // len(members) if end < now_ym else None)
        rows[ym] = (len(members), ms)

    mq = select(Month).where(Month.closed_at.is_not(None), Month.closed_at >= since, Month.user_id.in_(scope))
    if currency:
        mq = mq.where(Month.currency == currency)
    by_user: dict[str, list[Month]] = defaultdict(list)
    for m in db.scalars(mq):
        by_user[m.user_id].append(m)
    for ms in by_user.values():
        ms.sort(key=lambda m: m.year_month)

    rate = lambda m: rate_bp(m.income, m.envelopes)  # noqa: E731
    median = statistics.median_low([rate(ms[-1]) for ms in by_user.values()]) if by_user else None
    multi = [ms for ms in by_user.values() if len(ms) >= 2]
    improved = sum(rate(ms[-1]) > rate(ms[0]) for ms in multi) * 10000 // len(multi) if multi else None
    per_user = [Fraction(sum(r), len(r)) for r in ([m.helpfulness for m in ms if m.helpfulness is not None] for ms in by_user.values()) if r]
    helpfulness = int(sum(per_user) * 100 / len(per_user)) if per_user else None

    totals: dict[str, int] = defaultdict(int)
    holders: dict[str, set[str]] = defaultdict(set)
    for uid, ms in by_user.items():
        for m in ms:
            totals[m.currency] += _saved(m)
            holders[m.currency].add(uid)
    return {
        "events": events, "rows": rows, "signups": sum(n for n, _ in rows.values()),
        "median": (median, len(by_user)), "improved": (improved, len(multi)), "help": (helpfulness, len(per_user)),
        "amounts": {c: (totals[c], len(holders[c])) for c in totals},
    }


def compute(db: Session, now: datetime, days: int, currency: str | None, locale: str | None, admin_emails: list[str]) -> dict:
    admins = [e.lower() for e in admin_emails]
    f = _raw(db, now, days, currency, locale, admins)
    a = _raw(db, now, days, None, None, admins) if (currency or locale) else f  # population de référence pour le complément
    # Fenêtres emboîtées : 90 j et 365 j sont aussi comparés à chaque fenêtre plus courte (même filtre).
    smaller = [_raw(db, now, d, currency, locale, admins) for d in (30, 90) if d < days]

    def ok(n: int, whole: int, others: list[int]) -> bool:
        """Au moins MIN_GROUP personnes ; complément (tout - filtré) et écart avec chaque fenêtre plus courte : 0 ou >= MIN_GROUP."""
        return _ok(n) and all(d == 0 or _ok(d) for d in [whole - n, *(n - o for o in others)])

    def val(key: str):
        v, n = f[key]
        return v if v is not None and ok(n, a[key][1], [w[key][1] for w in smaller]) else None

    usage: dict = {}
    for key in EVENT_TYPES:
        total, anons = f["events"][key]
        usage[key] = total if ok(anons, a["events"][key][1], [w["events"][key][1] for w in smaller]) else None

    retention = []
    for ym in sorted(f["rows"]):
        n, ms = f["rows"][ym]
        shown = ok(n, a["rows"].get(ym, (0, []))[0], [w["rows"].get(ym, (0, []))[0] for w in smaller])
        retention.append({"cohort": ym, "users": n if shown else None, **{f"m{i + 1}_bp": ms[i] if shown else None for i in range(3)}})
    # Une cohorte masquée masque aussi le total (sinon total - lignes visibles la révèle).
    signups_ok = ok(f["signups"], a["signups"], [w["signups"] for w in smaller]) and all(r["users"] is not None for r in retention)
    usage["signups_completed"] = f["signups"] if signups_ok else None
    sims = usage["simulations"]
    usage["conversion_bp"] = usage["signups_completed"] * 10000 // sims if sims and usage["signups_completed"] is not None else None

    amounts = [
        {"currency": c, "saved_total": t if ok(h, a["amounts"].get(c, (0, 0))[1], [w["amounts"].get(c, (0, 0))[1] for w in smaller]) else None}
        for c, (t, h) in sorted(f["amounts"].items())
    ]
    return {
        "usage": usage,
        "retention": retention,
        "savings": {"median_rate_bp": val("median"), "improved_share_bp": val("improved"), "helpfulness_avg_x100": val("help")},
        "amounts": amounts,
        "min_group": MIN_GROUP,
    }
