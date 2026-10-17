from functools import lru_cache
from typing import Annotated, Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

LOCAL_DATABASE_URL = "sqlite:///./soonfinance.db"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", env_ignore_empty=True)

    # Neon in production (postgresql://…?sslmode=require); a local SQLite file otherwise.
    database_url: str = LOCAL_DATABASE_URL

    env: Literal["development", "production"] = "development"
    app_url: str = "http://localhost:3000"
    resend_api_key: str | None = None
    email_from: str = "Soon Finance <onboarding@resend.dev>"
    admin_emails: Annotated[list[str], NoDecode] = []  # comma-separated in the environment

    @field_validator("admin_emails", mode="before")
    @classmethod
    def _split_emails(cls, v):
        return [e.strip().lower() for e in v.split(",") if e.strip()] if isinstance(v, str) else v

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
