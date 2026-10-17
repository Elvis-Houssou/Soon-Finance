import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.scripts.export_methods import render_methods_json
from app.main import app
from app.domain.methods import DEFAULT_METHOD_ID, METHODS, get_method

COMMITTED_JSON = Path(__file__).resolve().parents[2] / "frontend" / "src" / "content" / "methods.json"


@pytest.mark.parametrize("method", METHODS, ids=lambda m: m.id)
def test_each_method_sums_to_100(method):
    assert sum(envelope.pct for envelope in method.envelopes) == 100


@pytest.mark.parametrize("method", METHODS, ids=lambda m: m.id)
def test_children_sum_to_100_when_present(method):
    for envelope in method.envelopes:
        if envelope.children:
            assert sum(child.pct for child in envelope.children) == 100, envelope.key


def test_ids():
    assert [m.id for m in METHODS] == [
        "50-30-20",
        "70-20-10",
        "80-20",
        "six-jars",
        "soon-10-70-20",
        "custom",
    ]


def test_default_is_not_demanding():
    assert get_method(DEFAULT_METHOD_ID).demanding is False


def test_unknown_method_raises_key_error():
    with pytest.raises(KeyError):
        get_method("nope")


def test_api_methods():
    response = TestClient(app).get("/api/methods")
    assert response.status_code == 200
    body = response.json()
    assert body["default"] == "50-30-20"
    assert len(body["methods"]) == 6


def test_committed_json_matches_export():
    committed = json.loads(COMMITTED_JSON.read_text(encoding="utf-8"))
    assert committed == json.loads(render_methods_json())
