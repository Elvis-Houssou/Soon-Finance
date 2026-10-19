# Soon Finance

Plateforme gratuite (FR / EN) qui aide à répartir son revenu, épargner et comprendre l'investissement.

```
backend/    API FastAPI (Python) : méthodes, conseils, base de données (SQLAlchemy + Alembic, Neon en production)
frontend/   Site Next.js : accueil, simulateur, comparaison (FR / EN, thèmes clair / sombre / auto)
shared/     Cas de test partagés par le backend et le frontend (calcul de la répartition)
docs/       Cahier des charges, charte, maquettes, plans
```

## Backend (`backend/`)

Prérequis : Python 3.12 et [uv](https://docs.astral.sh/uv/) (sur cette machine : `python -m uv` à la place de `uv`).

```bash
cd backend
uv sync
uv run alembic upgrade head                      # crée/met à jour la base (SQLite locale par défaut)
uv run uvicorn app.main:app --reload             # http://127.0.0.1:8000, documentation sur /docs
uv run pytest -q
```

Structure :

```
app/main.py            application FastAPI
app/api/router.py      routes sous /api (routes/health.py, methods.py, suggestions.py)
app/core/config.py     réglages (variable DATABASE_URL)
app/domain/            logique métier : répartition (money), méthodes, règles de conseils
app/schemas/           modèles d'entrée et de sortie de l'API (Pydantic)
app/db/                SQLAlchemy : Base des tables, session
app/scripts/           export des méthodes vers frontend/src/content/methods.json
alembic/               migrations de la base
```

Base de données : copier `.env.example` en `.env`. Sans `DATABASE_URL`, une base SQLite locale (`soonfinance.db`) est utilisée ; en production, mettre l'URL Neon (`postgresql://…?sslmode=require`).
Nouvelle migration : `uv run alembic revision --autogenerate -m "description"`.

Après toute modification des méthodes : `uv run python -m app.scripts.export_methods ../frontend/src/content/methods.json` (un test vérifie que le fichier est à jour).

## Frontend (`frontend/`)

Prérequis : Node 22. Le backend doit tourner sur `http://127.0.0.1:8000` (ou `API_ORIGIN`) : le site relaie `/api/*` vers lui.

```bash
cd frontend
npm install
npm run dev     # http://localhost:3000
npm test        # Vitest
npm run lint
npm run build
```

Tests de bout en bout : `npx playwright install chromium && npx playwright test` (Playwright démarre lui-même le backend et le site ; `UV=uv` si `uv` est dans le PATH, sinon `python -m uv` est utilisé).

La CI GitHub (`.github/workflows/ci.yml`) lance tous ces tests à chaque push et pull request.

## Déploiement

1. **Base sur Neon** : créer un projet (région Europe, Francfort) et copier l'URL de connexion.
2. **Backend sur Render** : créer un Blueprint en indiquant le fichier `backend/render.yaml` (Render cherche `render.yaml` à la racine par défaut), puis saisir `DATABASE_URL` (URL Neon). Le build applique les migrations Alembic. Noter l'URL du service.
3. **Frontend sur Vercel** : importer le dépôt, dossier racine `frontend/`, variable `API_ORIGIN` = URL Render (sans slash final). Copier `frontend/.env.example` pour le développement.
   `API_ORIGIN` doit être défini en production sur le frontend : sans lui, `/admin` renvoie toujours 404 et les réécritures `/api` échouent.
   Avant le lancement, remplacer les marqueurs de `frontend/src/content/legal.ts` (`PLACEHOLDERS` : date, raison sociale, adresse, immatriculation, responsable, email de contact).
4. **Vérifier** : `https://<backend>/api/health` renvoie `{"status":"ok"}`, puis le simulateur en ligne affiche des conseils.
