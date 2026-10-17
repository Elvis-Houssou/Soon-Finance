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

Prérequis : Node 20+. L'API doit tourner sur `http://127.0.0.1:8000` (ou `API_ORIGIN`) : `/api/*` lui est réécrit.

```bash
cd web
npm install
npm run dev     # http://localhost:3000
npm test        # Vitest
npm run build
npm run lint
```
