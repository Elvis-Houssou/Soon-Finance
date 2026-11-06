from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.schemas.simulation import Amount

Age = Annotated[int, Field(ge=18, le=100, strict=True)]
Rate = Annotated[float, Field(ge=0, le=20)]


class FireSimulationIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    age: Age
    target_age: Age
    monthly_expenses: Amount
    current_capital: Amount
    monthly_contribution: Amount
    inflation_pct: Annotated[float, Field(ge=0, le=20)] = 2.5
    withdrawal_rate_pct: Annotated[float, Field(ge=2, le=6)] = 4.0

    @model_validator(mode="after")
    def check_target_age(self):
        if self.target_age <= self.age:
            raise ValueError("target_age_must_exceed_age")
        if self.monthly_expenses <= 0:
            raise ValueError("monthly_expenses_must_be_positive")
        return self
