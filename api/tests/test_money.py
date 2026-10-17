import json
from pathlib import Path

import pytest

from soonfinance.money import CURRENCIES, MAX_INCOME_MINOR, split

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


def test_split_rejects_total_not_100():
    with pytest.raises(ValueError):
        split(1000, [50, 30, 10])


def test_split_rejects_income_above_max():
    with pytest.raises(ValueError):
        split(MAX_INCOME_MINOR + 1, [50, 30, 20])


def test_currencies_digits():
    assert CURRENCIES["XOF"] == 0
    assert CURRENCIES["EUR"] == 2
