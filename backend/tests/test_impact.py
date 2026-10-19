import statistics
import uuid
from datetime import UTC, datetime

import pytest

from app.db.models import Event, Month, User
from app.services import auth as auth_service

NOW = datetime(2026, 10, 15, 12, tzinfo=UTC)
ADMIN = "boss@x.com"


@pytest.fixture(autouse=True)
def setup(monkeypatch):
    monkeypatch.setattr(auth_service, "now", lambda: NOW)
    monkeypatch.setenv("ADMIN_EMAILS", "BOSS@x.com")


def add_user(s, i, created, locale="fr", currency="XOF"):
    u = User(id=f"u{i}-{uuid.uuid4()}", email=f"u{i}@x.com", locale=locale, currency=currency, consent_at=created, created_at=created)
    s.add(u)
    return u


def add_month(s, u, ym, saved, closed, help_=None, currency="XOF"):
    s.add(Month(
        id=str(uuid.uuid4()), user_id=u.id, year_month=ym, income=100000, currency=currency, method="50-30-20",
        envelopes=[{"kind": "save", "planned": 20000, "actual": saved}], helpfulness=help_, closed_at=closed, created_at=closed,
    ))


def add_events(s, etype, anons, per=1, locale="fr", currency="XOF"):
    for a in range(anons):
        for _ in range(per):
            s.add(Event(type=etype, anon_id=f"anon-{etype}-{a:03d}", locale=locale, currency=currency, occurred_at=datetime(2026, 10, 10, tzinfo=UTC)))


AUG, SEP, OCT = datetime(2026, 8, 5, tzinfo=UTC), datetime(2026, 9, 5, tzinfo=UTC), datetime(2026, 10, 1, 1, tzinfo=UTC)
AUG_CLOSE, OCT_CLOSE = datetime(2026, 8, 31, tzinfo=UTC), datetime(2026, 10, 1, tzinfo=UTC)
# (user index, year_month, saved, helpfulness)
SEEDED = [
    *[(i, "2026-08", 10000 + 2000 * i, None) for i in range(5)],
    *[(i, "2026-09", s, h) for i, s, h in zip(range(5), (13000, 11000, 16000, 20000, 17000), (5, 4, 4, 3, 5), strict=True)],
    *[(i, "2026-09", 15000 + 1000 * i, 4 if i == 5 else None) for i in range(5, 9)],
]


def seed_ten(client):
    with client.session_factory() as s:
        users = [add_user(s, i, AUG if i < 5 else SEP) for i in range(10)]
        s.flush()
        for i, ym, saved, h in SEEDED:
            add_month(s, users[i], ym, saved, AUG_CLOSE if ym == "2026-08" else OCT_CLOSE, h)
        add_events(s, "simulation_completed", 8, per=1)
        add_events(s, "simulation_completed", 1)  # 9th event, same anon as the first
        add_events(s, "comparison_viewed", 5)
        add_events(s, "signup_started", 2)
        s.commit()


def get(client, qs=""):
    return client.get(f"/api/admin/impact{qs}")


def test_non_admin_gets_404(client, login):
    assert login("someone@x.com").get("/api/admin/impact").status_code == 404


def test_unauthenticated_not_a_leak(client):
    assert get(client).status_code == 401


def test_admin_email_match_is_case_insensitive(client, login):
    assert get(login(ADMIN)).status_code == 200


def test_conversion_and_cohorts(client, login):
    seed_ten(client)
    c = login(ADMIN)
    d = c.get("/api/admin/impact?days=90").json()
    latest = {i: s for i, _, s, _ in SEEDED}  # SEEDED est trié par mois : le dernier gagne
    rates = [s // 10 for s in latest.values()]  # un taux par utilisateur ; revenu 100000
    assert d["usage"]["simulations"] == 9
    assert d["usage"]["comparisons"] == 5
    assert d["usage"]["signups_started"] is None  # 2 anon_id < 5
    assert d["usage"]["signups_completed"] == 10  # admin excluded
    assert d["usage"]["conversion_bp"] == 10 * 10000 // 9
    assert d["retention"] == [
        {"cohort": "2026-08", "users": 5, "m1_bp": 10000, "m2_bp": 10000, "m3_bp": None},  # M3 = octobre, pas fini
        {"cohort": "2026-09", "users": 5, "m1_bp": 8000, "m2_bp": None, "m3_bp": None},
    ]
    assert d["savings"]["median_rate_bp"] == statistics.median_low(rates)
    first = {i: s for i, ym, s, _ in SEEDED if ym == "2026-08"}
    last = {i: s for i, ym, s, _ in SEEDED if ym == "2026-09"}
    multi = [i for i in first if i in last]
    assert d["savings"]["improved_share_bp"] == sum(last[i] > first[i] for i in multi) * 10000 // len(multi) == 6000
    ratings = [h for *_, h in SEEDED if h]  # un seul avis par utilisateur dans le jeu
    assert d["savings"]["helpfulness_avg_x100"] == sum(ratings) * 100 // len(ratings)
    assert d["amounts"] == [{"currency": "XOF", "saved_total": sum(s for _, _, s, _ in SEEDED)}]
    assert d["min_group"] == 5


def test_small_groups_are_null(client, login):
    with client.session_factory() as s:
        users = [add_user(s, i, SEP) for i in range(4)]
        s.flush()
        for u in users:
            add_month(s, u, "2026-08", 20000, AUG_CLOSE, 5)
            add_month(s, u, "2026-09", 30000, OCT_CLOSE, 5)
        add_events(s, "simulation_completed", 4, per=3)
        s.commit()
    d = login(ADMIN).get("/api/admin/impact?days=90").json()
    assert d["usage"] == {k: None for k in d["usage"]}
    assert d["retention"] == [{"cohort": "2026-09", "users": None, "m1_bp": None, "m2_bp": None, "m3_bp": None}]
    assert d["savings"] == {k: None for k in d["savings"]}
    assert d["amounts"] == [{"currency": "XOF", "saved_total": None}]


def test_filters_leaving_few_users_hide_everything(client, login):
    seed_ten(client)
    with client.session_factory() as s:
        s.query(User).filter(User.id.like("u0-%") | User.id.like("u1-%")).update({"locale": "en"}, synchronize_session=False)
        s.commit()
    c = login(ADMIN)
    d = c.get("/api/admin/impact?days=90&locale=en").json()
    assert d["savings"] == {"median_rate_bp": None, "improved_share_bp": None, "helpfulness_avg_x100": None}
    assert d["amounts"] == [{"currency": "XOF", "saved_total": None}]
    assert all(r["users"] is None for r in d["retention"]) and d["usage"]["signups_completed"] is None
    eur = c.get("/api/admin/impact?days=90&currency=eur").json()
    assert eur["amounts"] == [] and eur["usage"]["simulations"] is None and eur["savings"]["median_rate_bp"] is None


def test_hidden_cohort_cannot_be_differenced(client, login):
    with client.session_factory() as s:
        for i in range(5):
            add_user(s, i, AUG)
        for i in range(5, 8):
            add_user(s, i, SEP)
        s.commit()
    d = login(ADMIN).get("/api/admin/impact?days=90").json()
    assert d["retention"][0]["users"] == 5 and d["retention"][1]["users"] is None
    assert d["usage"]["signups_completed"] is None  # 8 - 5 would reveal the hidden cohort of 3


def test_window_excludes_old_months(client, login):
    seed_ten(client)
    d = login(ADMIN).get("/api/admin/impact?days=30").json()
    assert [r["cohort"] for r in d["retention"]] == ["2026-09"]  # window start snapped to Sep 1; August cohort out
    assert d["amounts"] == [{"currency": "XOF", "saved_total": sum(s for _, ym, s, _ in SEEDED if ym == "2026-09")}]


def test_bad_params_rejected(client, login):
    c = login(ADMIN)
    assert c.get("/api/admin/impact?days=7").status_code == 422
    assert c.get("/api/admin/impact?locale=de").status_code == 422


def test_no_individual_fields_in_response(client, login):
    seed_ten(client)
    r = login(ADMIN).get("/api/admin/impact?days=90")
    text = r.text
    for banned in ("email", "user_id", "anon", "@x.com", "u0-", "first_name"):
        assert banned not in text
    d = r.json()
    assert set(d) == {"usage", "retention", "savings", "amounts", "min_group"}
    assert set(d["usage"]) == {"simulations", "comparisons", "signups_started", "signups_completed", "conversion_bp"}


def test_complement_rule_hides_filtered_figure(client, login):
    # 7 XOF holders, one of them English: locale=fr leaves 6 holders but a complement of 1 -> hidden.
    with client.session_factory() as s:
        users = [add_user(s, i, AUG, locale="en" if i == 6 else "fr") for i in range(7)]
        s.flush()
        for u in users:
            add_month(s, u, "2026-09", 20000, OCT_CLOSE, 4)
        s.commit()
    c = login(ADMIN)
    assert c.get("/api/admin/impact?days=90").json()["amounts"] == [{"currency": "XOF", "saved_total": 140000}]
    fr = c.get("/api/admin/impact?days=90&locale=fr").json()
    assert fr["amounts"] == [{"currency": "XOF", "saved_total": None}]
    assert fr["savings"] == {k: None for k in fr["savings"]}
    assert fr["retention"][0]["users"] is None and fr["usage"]["signups_completed"] is None


def test_complement_of_five_is_allowed(client, login):
    with client.session_factory() as s:
        users = [add_user(s, i, AUG, locale="en" if i < 5 else "fr") for i in range(11)]
        s.flush()
        for u in users:
            add_month(s, u, "2026-09", 20000, OCT_CLOSE)
        s.commit()
    fr = login(ADMIN).get("/api/admin/impact?days=90&locale=fr").json()
    assert fr["amounts"] == [{"currency": "XOF", "saved_total": 120000}]


def test_cohort_row_is_identical_across_periods(client, login):
    seed_ten(client)
    c = login(ADMIN)
    rows = [c.get(f"/api/admin/impact?days={d}").json()["retention"] for d in (90, 365)]
    assert rows[0] == rows[1] and len(rows[0]) == 2


def test_median_is_per_user_not_per_month(client, login):
    with client.session_factory() as s:
        users = [add_user(s, i, AUG) for i in range(5)]
        s.flush()
        for m in range(12):  # one heavy user: 12 months at 50 %
            add_month(s, users[0], f"{2025 + (10 + m) // 12}-{(10 + m) % 12 + 1:02d}", 50000, OCT_CLOSE)
        for u in users[1:]:
            add_month(s, u, "2026-09", 10000, OCT_CLOSE)
        s.commit()
    d = login(ADMIN).get("/api/admin/impact?days=365").json()
    assert d["savings"]["median_rate_bp"] == 1000  # by month it would be 5000
