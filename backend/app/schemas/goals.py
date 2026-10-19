from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.simulation import Amount

Label = Annotated[str, Field(min_length=1, max_length=60)]
Deadline = Annotated[str, Field(pattern=r"^\d{4}-(0[1-9]|1[0-2])$")]
Target = Annotated[int, Field(gt=0, strict=True, le=10**15)]


class GoalIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    label: Label
    target: Target
    deadline: Deadline
    saved: Amount = 0


class GoalPatch(BaseModel):
    model_config = ConfigDict(extra="forbid")
    label: Label | None = None
    target: Target | None = None
    deadline: Deadline | None = None
    saved: Amount | None = None


class Pace(BaseModel):
    monthly_needed: int
    on_track: bool
    projected: str | None


class GoalOut(BaseModel):
    id: str
    label: str
    target: int
    deadline: str
    saved: int
    pace: Pace
