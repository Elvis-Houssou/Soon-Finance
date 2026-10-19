from typing import Annotated, Self

from pydantic import BaseModel, ConfigDict, Field, StrictBool, StrictInt, model_validator

from app.domain.methods import Kind, get_method
from app.domain.money import CURRENCIES, MAX_INCOME_MINOR

Pct = Annotated[StrictInt, Field(ge=0, le=100)]
Amount = Annotated[StrictInt, Field(ge=0, le=MAX_INCOME_MINOR)]


class CustomEnvelopeIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    kind: Kind
    pct: Pct
    label: str | None = Field(default=None, max_length=40)


class PlanIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    income: Amount
    currency: str
    method: str
    envelopes: list[CustomEnvelopeIn] | None = None

    @model_validator(mode="after")
    def _check(self) -> Self:
        if self.currency not in CURRENCIES:
            raise ValueError("unknown currency")
        try:
            get_method(self.method)
        except KeyError:
            raise ValueError("unknown method") from None
        if self.method == "custom":
            envs = self.envelopes
            if not envs or len(envs) > 8 or sum(e.pct for e in envs) != 100:
                raise ValueError("custom needs 1-8 envelopes totalling 100")
        return self


class SimulationIn(PlanIn):
    essentials: Amount | None = None
    has_debt: StrictBool | None = None
    savings: Amount | None = None


class Suggestion(BaseModel):
    id: str
    params: dict[str, int] = Field(default_factory=dict)


class SuggestionsOut(BaseModel):
    suggestions: list[Suggestion]
