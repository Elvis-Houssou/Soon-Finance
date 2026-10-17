import os
import secrets
import uuid
from datetime import UTC, datetime, timedelta
from pathlib import Path

# R1: never touch the real Neon DB / Resend key from backend/.env. Must run before app imports.
os.environ.update(DATABASE_URL="sqlite:///:memory:", RESEND_API_KEY="", ENV="development")

import pytest  # noqa: E402
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import Settings, get_settings  # noqa: E402
from app.db.models import SessionToken, User  # noqa: E402
from app.db.session import enable_sqlite_foreign_keys, get_engine, get_session  # noqa: E402
from app.main import app  # noqa: E402
from app.services.auth import SESSION_COOKIE, hash_token  # noqa: E402

Settings.model_config["env_file"] = None  # backend/.env is never loaded in tests

BACKEND = Path(__file__).resolve().parents[1]


@pytest.fixture(autouse=True)
def _isolated_settings():
    get_settings.cache_clear()
    get_engine.cache_clear()
    yield
    get_settings.cache_clear()
    get_engine.cache_clear()


@pytest.fixture
def db_url(tmp_path):
    # Never reads backend/.env: the URL is explicit and Alembic gets it via sqlalchemy.url.
    url = f"sqlite:///{(tmp_path / 'test.db').as_posix()}"
    config = Config(str(BACKEND / "alembic.ini"))
    config.set_main_option("sqlalchemy.url", url)
    command.upgrade(config, "head")
    return url


@pytest.fixture
def engine(db_url):
    engine = create_engine(db_url)
    enable_sqlite_foreign_keys(engine)
    yield engine
    engine.dispose()


@pytest.fixture
def client(engine, db_url):
    factory = sessionmaker(bind=engine)

    def override_session():
        with factory() as session:
            yield session

    app.dependency_overrides[get_session] = override_session
    app.dependency_overrides[get_settings] = lambda: Settings(_env_file=None, database_url=db_url)
    with TestClient(app) as test_client:
        test_client.session_factory = factory
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def login(client):
    def _login(email: str) -> TestClient:
        raw = secrets.token_urlsafe(32)
        now = datetime.now(UTC)
        with client.session_factory() as session:
            user = User(id=str(uuid.uuid4()), email=email, consent_at=now, created_at=now)
            session.add(user)
            session.flush()
            session.add(SessionToken(id_hash=hash_token(raw), user_id=user.id, expires_at=now + timedelta(days=30), created_at=now))
            session.commit()
        client.cookies.set(SESSION_COOKIE, raw)
        return client

    return _login
