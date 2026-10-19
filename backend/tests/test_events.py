from sqlalchemy import select

from app.db.models import Event

E = {"type": "simulation_completed", "anon_id": "abcdefgh1", "locale": "fr", "currency": "XOF"}


def test_events_accepts_whitelisted_type(client):
    for t in ("simulation_completed", "comparison_viewed", "signup_started"):
        assert client.post("/api/events", json={**E, "type": t}).status_code == 204


def test_events_rejects_server_types_and_extra_fields(client):
    for t in ("signup_completed", "month_closed", "nope"):
        assert client.post("/api/events", json={**E, "type": t}).status_code == 422
    assert client.post("/api/events", json={**E, "email": "a@x.com"}).status_code == 422
    assert client.post("/api/events", json={**E, "anon_id": "x" * 65}).status_code == 422
    for bad in ("kofi@exemple.com", "short", "has space 123"):
        assert client.post("/api/events", json={**E, "anon_id": bad}).status_code == 422


def test_events_store_no_personal_fields(client):
    client.post("/api/events", json=E)
    with client.session_factory() as s:
        e = s.scalar(select(Event))
        assert (e.type, e.anon_id, e.locale, e.currency) == ("simulation_completed", "abcdefgh1", "fr", "XOF")
        assert not {c.name for c in Event.__table__.columns} & {"email", "user_id", "first_name", "amount"}
