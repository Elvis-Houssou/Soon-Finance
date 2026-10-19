from typing import Annotated, Literal

from pydantic import AfterValidator, BaseModel, ConfigDict, Field

from app.domain.money import CURRENCIES


def _currency(v: str) -> str:
    if v not in CURRENCIES:
        raise ValueError("unsupported currency")
    return v


Currency = Annotated[str, AfterValidator(_currency)]


class MePatch(BaseModel):
    model_config = ConfigDict(extra="forbid")
    first_name: Annotated[str, Field(max_length=40)] | None
    locale: Literal["fr", "en"]
    currency: Currency


class EventIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    type: Literal["simulation_completed", "comparison_viewed", "signup_started"]
    anon_id: Annotated[str, Field(pattern=r"^[A-Za-z0-9_-]{8,64}$")]
    locale: Literal["fr", "en"]
    currency: Currency
