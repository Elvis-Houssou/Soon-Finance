from typing import Annotated, Self

from pydantic import BaseModel, ConfigDict, Field, StrictBool, StrictInt, model_validator

from soonfinance.methods import Kind, get_method
from soonfinance.money import CURRENCIES, MAX_INCOME_MINOR, split

Pct = Annotated[StrictInt, Field(ge=0, le=100)]


class CustomEnvelopeIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    kind: Kind
    pct: Pct


class SimulationIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    income: Annotated[StrictInt, Field(ge=0, le=MAX_INCOME_MINOR)]
    currency: str
    method: str
    envelopes: list[CustomEnvelopeIn] | None = None
    essentials: Annotated[StrictInt, Field(ge=0)] | None = None
    has_debt: StrictBool | None = None
    savings: Annotated[StrictInt, Field(ge=0)] | None = None

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


class Suggestion(BaseModel):
    id: str
    params: dict[str, int] = Field(default_factory=dict)


def suggest(sim: SimulationIn) -> list[Suggestion]:
    if sim.method == "custom":
        pairs = [(e.kind, e.pct) for e in sim.envelopes or []]
    else:
        pairs = [(e.kind, e.pct) for e in get_method(sim.method).envelopes]
    amounts = split(sim.income, [p for _, p in pairs])
    live = sum(a for (k, _), a in zip(pairs, amounts) if k in ("need", "want", "learn"))
    saved = sum(a for (k, _), a in zip(pairs, amounts) if k in ("save", "save2"))
    ess, sav = sim.essentials, sim.savings
    out: list[Suggestion] = []
    if ess is not None and live < ess:
        out.append(Suggestion(id="essentials-not-covered", params={"live": live, "essentials": ess}))
    if sim.has_debt is True:
        out.append(Suggestion(id="repay-debt-first"))
    if ess is not None and sav is not None and sav < 3 * ess:
        out.append(Suggestion(id="build-emergency-fund", params={"min": 3 * ess, "max": 6 * ess}))
    if sim.income > 0 and saved * 10 < sim.income:
        out.append(Suggestion(id="start-saving-10"))
    if ess is not None and sav is not None and sav >= 3 * ess and sim.has_debt is not True:
        out.append(Suggestion(id="learn-investing"))
    return out
