import json
from pathlib import Path

import pytest

from app.domain.money import CURRENCIES, MAX_INCOME_MINOR, split

CASES_PATH = Path(__file__).resolve().parents[2] / "shared" / "split-cases.json"
CASES = json.loads(CASES_PATH.read_text(encoding="utf-8"))


@pytest.mark.parametrize(
    "case", CASES, ids=[f"{c['income']}-{c['pcts']}" for c in CASES]
)
def test_split_matches_shared_cases(case):
    assert split(case["income"], case["pcts"]) == case["expected"]


@pytest.mark.parametrize(
    "case", CASES, ids=[f"{c['income']}-{c['pcts']}" for c in CASES]
)
def test_split_sum_equals_income(case):
    assert sum(split(case["income"], case["pcts"])) == case["income"]


@pytest.mark.parametrize(
    "case", CASES, ids=[f"{c['income']}-{c['pcts']}" for c in CASES]
)
def test_split_amounts_non_negative(case):
    assert all(part >= 0 for part in split(case["income"], case["pcts"]))


def test_split_rejects_total_not_100():
    with pytest.raises(ValueError):
        split(1000, [50, 30, 10])


def test_split_rejects_income_above_max():
    with pytest.raises(ValueError):
        split(MAX_INCOME_MINOR + 1, [50, 30, 20])


def test_split_rejects_pct_out_of_range():
    with pytest.raises(ValueError):
        split(1000, [-10, 110])


def test_split_rejects_negative_income():
    with pytest.raises(ValueError):
        split(-1, [50, 50])


def test_split_rejects_non_int_inputs():
    with pytest.raises(ValueError):
        split(True, [50, 50])
    with pytest.raises(ValueError):
        split(1000.0, [50, 50])
    with pytest.raises(ValueError):
        split(1000, [True, 99])
    with pytest.raises(ValueError):
        split(1000, [50.0, 50])


def test_currencies_digits():
    assert CURRENCIES["XOF"] == 0
    assert CURRENCIES["EUR"] == 2
