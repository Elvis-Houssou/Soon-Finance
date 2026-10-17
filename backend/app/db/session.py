from collections.abc import Iterator
from functools import lru_cache

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings


@lru_cache
def get_engine() -> Engine:
    # Created on first use so the API starts (and tests run) without a reachable database.
    return create_engine(get_settings().database_url, pool_pre_ping=True)


def get_session() -> Iterator[Session]:
    """FastAPI dependency: one session per request."""
    with sessionmaker(bind=get_engine())() as session:
        yield session
