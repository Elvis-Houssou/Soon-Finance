from fastapi import APIRouter

from app.domain.fire import fire_projection
from app.schemas.fire import FireSimulationIn

router = APIRouter()


@router.post("/fire/simulate")
def simulate_fire(body: FireSimulationIn):
    return fire_projection(**body.model_dump())
