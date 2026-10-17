# Soon Finance

## API (`api/`)

Prérequis : Python 3.12 et [uv](https://docs.astral.sh/uv/).

```bash
cd api
python -m uv run uvicorn soonfinance.main:app --reload
```

Tests :

```bash
cd api
python -m uv run pytest -q
```

## Web (`web/`)

Voir `web/` (à venir).
