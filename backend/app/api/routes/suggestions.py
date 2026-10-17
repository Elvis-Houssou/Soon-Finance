from fastapi import APIRouter

from app.domain.suggestions import suggest
from app.schemas.simulation import SimulationIn, SuggestionsOut

router = APIRouter()


@router.post("/suggestions")
def suggestions(sim: SimulationIn) -> SuggestionsOut:
    return SuggestionsOut(suggestions=suggest(sim))
