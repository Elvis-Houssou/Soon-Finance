from typing import Any

from fastapi import FastAPI

from soonfinance.methods import catalogue

app = FastAPI(title="Soon Finance API")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/methods")
def methods() -> dict[str, Any]:
    return catalogue()
