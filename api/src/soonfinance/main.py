from typing import Any

from fastapi import FastAPI

from soonfinance.methods import catalogue
from soonfinance.suggestions import SimulationIn, suggest

app = FastAPI(title="Soon Finance API")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/methods")
def methods() -> dict[str, Any]:
    return catalogue()


@app.post("/api/suggestions")
def suggestions(sim: SimulationIn) -> dict[str, Any]:
    return {"suggestions": [s.model_dump() for s in suggest(sim)]}
