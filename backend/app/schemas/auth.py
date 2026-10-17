import re
from typing import Literal

from pydantic import BaseModel, field_validator

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class RequestLink(BaseModel):
    email: str
    locale: Literal["fr", "en"]
    consent: Literal[True]
    next: str | None = None

    @field_validator("email")
    @classmethod
    def _email(cls, v: str) -> str:
        v = v.strip().lower()
        if len(v) > 254 or not EMAIL_RE.match(v):
            raise ValueError("invalid email")
        return v

    @field_validator("next")
    @classmethod
    def _next(cls, v: str | None) -> str | None:
        if v is not None and (not v.startswith("/") or v.startswith("//") or "\\" in v or len(v) > 500):
            raise ValueError("invalid next")
        return v
