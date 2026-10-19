from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StrictBool, StrictInt

from app.schemas.simulation import Amount, PlanIn


class MonthPlanIn(PlanIn):
    pass


class ProfileIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    essentials: Amount | None = None
    has_debt: StrictBool | None = None
    savings: Amount | None = None


class CloseIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    actuals: list[Amount]
    went_well: Annotated[str, Field(max_length=500)] | None = None
    change_next: Annotated[str, Field(max_length=500)] | None = None
    helpfulness: Annotated[StrictInt, Field(ge=1, le=5)] | None = None


class Review(BaseModel):
    went_well: str | None
    change_next: str | None


class MonthOut(BaseModel):
    year_month: str
    income: int
    currency: str
    method: str
    envelopes: list[dict]
    review: Review | None
    helpfulness: int | None
    closed_at: datetime | None
    editable_until: datetime | None
    savings_rate_bp: int | None
    kept: bool | None


class CloseOut(BaseModel):
    month: MonthOut
    previous_rate_bp: int | None
    steps: int
