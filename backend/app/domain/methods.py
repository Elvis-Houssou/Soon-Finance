from typing import Any, Literal

from pydantic import BaseModel, Field

Kind = Literal["need", "want", "save", "save2", "give", "learn"]


class SubEnvelope(BaseModel):
    key: str
    pct: int


class Envelope(BaseModel):
    key: str
    kind: Kind
    pct: int
    children: list[SubEnvelope] = Field(default_factory=list)


class Method(BaseModel):
    id: str
    envelopes: list[Envelope]
    demanding: bool = False
    custom: bool = False


def _env(key: str, kind: Kind, pct: int, *children: tuple[str, int]) -> Envelope:
    return Envelope(
        key=key,
        kind=kind,
        pct=pct,
        children=[SubEnvelope(key=k, pct=p) for k, p in children],
    )


METHODS: list[Method] = [
    Method(
        id="50-30-20",
        envelopes=[
            _env("needs", "need", 50),
            _env("wants", "want", 30),
            _env("savings", "save", 20),
        ],
    ),
    Method(
        id="70-20-10",
        envelopes=[
            _env("spending", "need", 70),
            _env("savings", "save", 20),
            _env("giving", "give", 10),
        ],
    ),
    Method(
        id="80-20",
        envelopes=[
            _env("spending", "need", 80),
            _env("savings", "save", 20),
        ],
    ),
    Method(
        id="six-jars",
        envelopes=[
            _env("necessities", "need", 55),
            _env("invest", "save", 10),
            _env("long-term", "save2", 10),
            _env("education", "learn", 10),
            _env("play", "want", 10),
            _env("giving", "give", 5),
        ],
    ),
    Method(
        id="soon-10-70-20",
        demanding=True,
        envelopes=[
            _env("giving", "give", 10),
            _env(
                "save-invest",
                "save",
                70,
                ("investments", 50),
                ("emergency-fund", 20),
                ("long-term-projects", 20),
                ("financial-education", 10),
            ),
            _env(
                "personal",
                "need",
                20,
                ("leisure", 30),
                ("books", 25),
                ("gifts", 20),
                ("wellbeing", 15),
                ("flex", 10),
            ),
        ],
    ),
    Method(
        id="custom",
        custom=True,
        envelopes=[
            _env("needs", "need", 60),
            _env("savings", "save", 25),
            _env("pleasures", "want", 15),
        ],
    ),
]

DEFAULT_METHOD_ID = "50-30-20"


def get_method(id: str) -> Method:
    for method in METHODS:
        if method.id == id:
            return method
    raise KeyError(id)


def catalogue() -> dict[str, Any]:
    return {
        "default": DEFAULT_METHOD_ID,
        "methods": [method.model_dump(mode="json") for method in METHODS],
    }
