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

## Tests

- API : `cd api && python -m uv run pytest -q`
- Web unitaires : `cd web && npx vitest run`
- Web bout en bout : `cd web && npx playwright install chromium && npx playwright test` (Playwright démarre l'API et le site lui-même ; `UV=uv` si `uv` est dans le PATH, sinon `python -m uv` est utilisé).

La CI GitHub (`.github/workflows/ci.yml`) lance tout cela à chaque push et pull request.

## Déploiement

1. **API sur Render** : créer un service depuis `api/render.yaml` (Blueprint) ou un Web Service Python avec la racine `api`, build `pip install uv && uv sync --frozen`, start `uv run uvicorn soonfinance.main:app --host 0.0.0.0 --port $PORT`, health check `/api/health`. Noter l'URL obtenue.
2. **Site sur Vercel** : importer le dépôt, dossier racine `web/`, variable d'environnement `API_ORIGIN` = URL Render (sans slash final). Copier `web/.env.example` pour le développement.
3. **Vérifier** : `https://<api>/api/health` doit renvoyer `{"status":"ok"}`, puis que le simulateur en ligne affiche des conseils.
