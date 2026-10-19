import logging
from functools import lru_cache
from typing import Annotated, Literal

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

log = logging.getLogger(__name__)
LOCAL_DATABASE_URL = "sqlite:///./soonfinance.db"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", env_ignore_empty=True)

    # Neon in production (postgresql://…?sslmode=require); a local SQLite file otherwise.
    database_url: str = LOCAL_DATABASE_URL

    env: Literal["development", "production"] = "development"
    app_url: str = "http://localhost:3000"  # the website (CORS origin, redirects after sign-in)
    api_url: str = "http://localhost:8000"  # this API, as the browser reaches it (magic links point here)
    resend_api_key: str | None = None
    email_from: str = "Soon Finance <onboarding@resend.dev>"
    admin_emails: Annotated[list[str], NoDecode] = []  # comma-separated in the environment
    login_limit_per_ip: Annotated[int, Field(ge=1)] = 20  # login links per IP per hour; raised only by the e2e backend

    @field_validator("admin_emails", mode="before")
    @classmethod
    def _split_emails(cls, v):
        return [e.strip().lower() for e in v.split(",") if e.strip()] if isinstance(v, str) else v

    @model_validator(mode="after")
    def _production_is_safe(self):
        if self.env == "production":
            if not self.resend_api_key:
                raise ValueError("RESEND_API_KEY is required in production")
            if not self.app_url.startswith("https://") or not self.api_url.startswith("https://"):
                raise ValueError("APP_URL and API_URL must start with https:// in production")
            if "resend.dev" in self.email_from:
                log.warning("EMAIL_FROM uses resend.dev: no verified domain yet, mail only reaches the Resend account owner")
        return self

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
