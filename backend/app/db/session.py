from collections.abc import Iterator
from functools import lru_cache

from sqlalchemy import Engine, create_engine, event
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings


def connect_args(url: str) -> dict[str, object]:
    # Neon's pooler (PgBouncer, transaction mode) breaks psycopg's automatic prepared statements.
    return {"prepare_threshold": None} if url.startswith("postgresql+psycopg") else {}


def enable_sqlite_foreign_keys(engine: Engine) -> None:
    """SQLite ignores foreign keys (so ON DELETE CASCADE) unless enabled on every connection."""
    if engine.dialect.name == "sqlite":
        event.listen(engine, "connect", lambda conn, _: conn.execute("PRAGMA foreign_keys=ON"))


@lru_cache
def get_engine() -> Engine:
    # Created on first use so the API starts (and tests run) without a reachable database.
    url = get_settings().database_url
    engine = create_engine(url, pool_pre_ping=True, connect_args=connect_args(url))
    enable_sqlite_foreign_keys(engine)
    return engine


def get_session() -> Iterator[Session]:
    """FastAPI dependency: one session per request."""
    with sessionmaker(bind=get_engine())() as session:
        yield session
