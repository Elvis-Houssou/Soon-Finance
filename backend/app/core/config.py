from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

LOCAL_DATABASE_URL = "sqlite:///./soonfinance.db"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Neon in production (postgresql://…?sslmode=require); a local SQLite file otherwise.
    database_url: str = LOCAL_DATABASE_URL

    @field_validator("database_url")
    @classmethod
    def _use_psycopg(cls, url: str) -> str:
        if not url.strip():  # DATABASE_URL= left empty in .env
            return LOCAL_DATABASE_URL
        # Neon hands out postgres:// or postgresql:// URLs; SQLAlchemy needs the psycopg (v3) driver name.
        for prefix in ("postgres://", "postgresql://"):
            if url.startswith(prefix):
                return "postgresql+psycopg://" + url[len(prefix):]
        return url


@lru_cache
def get_settings() -> Settings:
    return Settings()
