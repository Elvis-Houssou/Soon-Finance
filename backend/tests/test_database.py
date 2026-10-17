from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine

from app.core.config import Settings

BACKEND = Path(__file__).resolve().parents[1]


def test_neon_url_uses_psycopg_driver():
    url = Settings(database_url="postgresql://u:p@ep-x.neon.tech/db?sslmode=require").database_url
    assert url == "postgresql+psycopg://u:p@ep-x.neon.tech/db?sslmode=require"
    assert Settings(database_url="postgres://u:p@h/db").database_url == "postgresql+psycopg://u:p@h/db"


def test_empty_url_falls_back_to_local_sqlite():
    assert Settings(database_url="").database_url == "sqlite:///./soonfinance.db"


def test_sqlite_url_is_kept():
    assert Settings(database_url="sqlite:///./x.db").database_url == "sqlite:///./x.db"


def test_migrations_upgrade_and_downgrade(tmp_path):
    url = f"sqlite:///{(tmp_path / 'test.db').as_posix()}"
    config = Config(str(BACKEND / "alembic.ini"))
    config.set_main_option("sqlalchemy.url", url)

    command.upgrade(config, "head")
    engine = create_engine(url)
    with engine.connect() as connection:
        assert connection.exec_driver_sql("select version_num from alembic_version").scalar() == "0002"

    command.downgrade(config, "base")
    with engine.connect() as connection:
        assert connection.exec_driver_sql("select count(*) from alembic_version").scalar() == 0
    engine.dispose()
