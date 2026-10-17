import uuid
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest
from alembic import command
from alembic.autogenerate import compare_metadata
from alembic.config import Config
from alembic.migration import MigrationContext
from sqlalchemy import func, inspect, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.base import Base
from app.db.models import Goal, Month, Profile, SessionToken, User

BACKEND = Path(__file__).resolve().parents[1]
NOW = datetime.now(UTC)
TABLES = {"users", "login_tokens", "sessions", "profiles", "months", "goals", "events"}


def new_user(session: Session) -> User:
    user = User(id=str(uuid.uuid4()), email=f"{uuid.uuid4()}@x.io", consent_at=NOW, created_at=NOW)
    session.add(user)
    session.flush()
    return user


def new_month(user: User) -> Month:
    return Month(id=str(uuid.uuid4()), user_id=user.id, year_month="2026-10", income=100, currency="XOF",
                 method="50-30-20", envelopes=[], created_at=NOW)


def test_upgrade_creates_tables(engine):
    assert TABLES <= set(inspect(engine).get_table_names())


def test_month_unique_per_user_and_month(engine):
    with Session(engine) as session:
        user = new_user(session)
        session.add(new_month(user))
        session.commit()
        session.add(new_month(user))
        with pytest.raises(IntegrityError):
            session.commit()


def test_delete_user_cascades(engine):
    with Session(engine) as session:
        user = new_user(session)
        session.add_all([
            Profile(user_id=user.id, essentials=1),
            new_month(user),
            Goal(id=str(uuid.uuid4()), user_id=user.id, label="g", target=10, deadline="2027-01", created_at=NOW),
            SessionToken(id_hash="h", user_id=user.id, expires_at=NOW + timedelta(days=1), created_at=NOW),
        ])
        session.commit()
        session.delete(user)
        session.commit()
        for model in (Profile, Month, Goal, SessionToken):
            assert session.scalar(select(func.count()).select_from(model)) == 0


def test_cascade_is_enforced_by_the_database(engine):
    with Session(engine) as session:
        user = new_user(session)
        session.add(new_month(user))
        session.commit()
        session.execute(User.__table__.delete())  # bypasses the ORM cascade
        session.commit()
        assert session.scalar(select(func.count()).select_from(Month)) == 0


def test_downgrade_to_0001_drops_tables(engine, db_url):
    config = Config(str(BACKEND / "alembic.ini"))
    config.set_main_option("sqlalchemy.url", db_url)
    command.downgrade(config, "0001")
    assert not TABLES & set(inspect(engine).get_table_names())


def test_tests_never_read_real_env():
    settings = get_settings()
    assert settings.database_url.startswith("sqlite")
    assert not getattr(settings, "resend_api_key", "")


def test_datetimes_round_trip_as_utc(engine):
    with Session(engine) as session:
        user = new_user(session)
        session.add(SessionToken(id_hash="t", user_id=user.id, expires_at=datetime.now(UTC), created_at=NOW))
        session.commit()
        session.expire_all()
        assert session.get(SessionToken, "t").expires_at.tzinfo is UTC


def test_amounts_hold_values_beyond_32_bits(engine):
    with Session(engine) as session:
        user = new_user(session)
        month = new_month(user)
        month.income = 10**12
        session.add(month)
        session.commit()
        assert session.get(Month, month.id).income == 10**12


def test_models_match_migrations(engine):
    with engine.connect() as connection:
        diff = compare_metadata(MigrationContext.configure(connection), Base.metadata)
    assert diff == []
