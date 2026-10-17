# Plan 2 — Comptes et suivi : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter les comptes gratuits (lien magique) et tout le suivi mensuel : tableau de bord (premier usage et suivi), bilan du mois et écran « Un pas de plus », historique, objectifs, paramètres, avec les règles de conseils 6 à 9.

**Architecture:** Le backend FastAPI (`backend/app`) gagne des tables SQLAlchemy (migration Alembic `0002`), un service d'authentification par lien magique (jeton haché, session en cookie `httpOnly`), et des routes `/api/auth`, `/api/me`, `/api/months`, `/api/goals`, `/api/onboarding`, `/api/dashboard`, `/api/events`, toutes filtrées sur l'utilisateur connecté. Le frontend Next.js appelle ces routes en même origine (réécriture `/api/*` existante) depuis des composants client ; `proxy.ts` protège les pages du compte.

**Tech Stack:** FastAPI, SQLAlchemy 2, Alembic, Pydantic v2, pydantic-settings, httpx (envoi Resend), pytest · Next.js 16.4.1, React 19.3, TypeScript strict, Tailwind v4, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-16-soon-finance-design.md` (§5 écrans 5-9, §6.4 règles 6-9, §7 données/sécurité/vie privée, §8 événements, §9 erreurs) · Maquettes : `docs/maquettes/` (`Connexion*`, `LienEnvoye*`, `LienExpire*`, `TableauNouveau*`, `Tableau*`, `Cloture*`, `MoisBoucle*`, `Historique*`, `Objectifs*`, `Parametres*`) · Charte : `docs/brand-guidelines.md`.

## Global Constraints

- Dossiers : `backend/` (paquet `app/` : `api/routes`, `core`, `domain`, `schemas`, `db`, `services`) et `frontend/`. Lancer uv avec `python -m uv` sur cette machine.
- Montants en **unités mineures entières** ; aucune conversion de devise ; répartition par `app.domain.money.split` (backend) — le backend recalcule toujours les montants prévus, il ne fait jamais confiance au client.
- Mois identifié par `"YYYY-MM"` ; « mois courant » = date UTC du serveur.
- **Mois tenu** = épargne réelle ≥ épargne prévue (types `save` + `save2`). **Taux d'épargne** en points de base entiers : `saved * 10000 // income` (0 si revenu 0).
- **Pas du soleil** : on parcourt les mois clôturés du plus ancien au plus récent ; le premier compte 1 pas ; chaque suivant compte 1 pas si son taux est strictement supérieur au précédent ; maximum affiché 12.
- Lien magique : jeton aléatoire `secrets.token_urlsafe(32)`, stocké **haché** (SHA-256), valable **15 minutes**, **usage unique**. Limite : **5 demandes par email et par heure**, **20 par IP et par heure** → 429.
- Session : identifiant aléatoire, stocké haché, cookie `sf_session` (`HttpOnly`, `SameSite=Lax`, `Path=/`, `Max-Age=2592000` = 30 jours, `Secure` hors développement).
- **Isolation** : toute donnée personnelle est lue/écrite via la dépendance `current_user` ; un utilisateur ne peut ni lire ni modifier les données d'un autre (404, jamais 403 qui confirmerait l'existence).
- Suppression du compte = suppression définitive en cascade de toutes ses lignes. Export = JSON complet de ses données.
- Événements anonymes : jamais d'email, de nom ni de montant.
- Frontend : mêmes conventions que le plan 1 (dictionnaires fr/en typés, vouvoiement, tokens uniquement, 44 px, 360 px, `role="status"` pour les annonces). Écrans conformes aux maquettes listées ci-dessus.
- Mention « Contenu éducatif, pas un conseil financier personnalisé. » sur le tableau de bord.

## Review Focus

1. **Lien cliqué deux fois / après 15 min / sur un autre appareil** : la 2e fois mène à « Ce lien a expiré » sans erreur serveur ; un lien valide ouvre le compte même sur un autre navigateur. → Task 2.
2. **Bilan dont le total ne fait pas le revenu, ou modifié après 7 jours** : refus clair (422 `totals_mismatch`, 409 `locked`), saisie conservée côté page. → Tasks 3, 8.
3. **Deux onglets / double clic sur « Clôturer »** : pas de mois clôturé deux fois ni de mois suivant créé en double. → Task 3.
4. **Utilisateur sans aucune donnée** (inscrit sans simulation) : tableau de bord en état premier usage, aucune erreur, invitation à faire une simulation. → Tasks 4, 7.
5. **Session expirée pendant l'utilisation** : toute réponse 401 renvoie vers la connexion avec `?next=` vers la page courante, sans perdre la langue. → Task 6.

---

### Task 1: Tables et migration 0002

**Files:**
- Create: `backend/app/db/models/__init__.py`, `backend/app/db/models/user.py`, `backend/app/db/models/auth.py`, `backend/app/db/models/budget.py`, `backend/app/db/models/event.py`, `backend/alembic/versions/20261017_0002_accounts.py`, `backend/tests/conftest.py`, `backend/tests/test_models.py`
- Modify: `backend/alembic/env.py` (importer `app.db.models`), `backend/app/db/session.py` (activer `PRAGMA foreign_keys=ON` pour SQLite)

**Interfaces:**
- Produces (SQLAlchemy 2, `Mapped[...]`, clés primaires `id` UUID texte `str(uuid4())` sauf `Event` en entier auto) :
  - `User(id, email unique lower, first_name: str|None, locale: str="fr", currency: str="XOF", role: str="user", consent_at: datetime, created_at)`.
  - `LoginToken(id, email, token_hash unique, locale, next_path: str|None, ip_hash, expires_at, used_at: datetime|None, created_at)`.
  - `SessionToken(id_hash pk, user_id fk→users ON DELETE CASCADE, expires_at, created_at)`.
  - `Profile(user_id pk fk CASCADE, essentials: int|None, has_debt: bool|None, savings: int|None)`.
  - `Month(id, user_id fk CASCADE, year_month: str, income: int, currency: str, method: str, envelopes: JSON, review_went_well: str|None, review_change_next: str|None, helpfulness: int|None, closed_at: datetime|None, created_at)` + contrainte unique `(user_id, year_month)`. `envelopes` = liste de `{key, label, kind, pct, planned, actual, children:[{key, pct, planned}]}` (`label` null hors méthode personnalisée, `actual` null tant que non clôturé).
  - `Goal(id, user_id fk CASCADE, label: str, target: int, deadline: str "YYYY-MM", saved: int=0, created_at)`.
  - `Event(id, type: str, occurred_at, locale: str|None, currency: str|None, anon_id: str|None)` (aucune clé vers `users`).
- Produces `tests/conftest.py` fixtures : `db_url` (SQLite temporaire migré avec `alembic upgrade head`), `client` (`TestClient` avec `get_session` surchargé), `login(client, email) -> TestClient` (crée l'utilisateur et la session directement en base, pose le cookie).

- [ ] **Step 1: Write the failing tests** — `test_upgrade_creates_tables` (tables `users, login_tokens, sessions, profiles, months, goals, events` présentes) ; `test_month_unique_per_user_and_month` (2e insertion même `(user, "2026-10")` → `IntegrityError`) ; `test_delete_user_cascades` (user avec profile, month, goal, session → supprimé → 0 ligne restante dans ces tables) ; `test_downgrade_to_0001_drops_tables`.
- [ ] **Step 2: Run** `cd backend && python -m uv run pytest tests/test_models.py -q` → FAIL.
- [ ] **Step 3: Implement** les modèles, la migration (écrite à la main, `down_revision="0001"`), le `PRAGMA` SQLite (écouteur `connect` uniquement si l'URL commence par `sqlite`), les fixtures.
- [ ] **Step 4: Run** `python -m uv run pytest -q` → all passed.
- [ ] **Step 5: Commit** `git commit -m "feat(backend): tables des comptes et migration 0002"`

### Task 2: Authentification par lien magique

**Files:**
- Create: `backend/app/services/__init__.py`, `backend/app/services/email.py`, `backend/app/services/auth.py`, `backend/app/api/deps.py`, `backend/app/api/routes/auth.py`, `backend/app/api/routes/me.py`, `backend/app/schemas/auth.py`, `backend/tests/test_auth.py`
- Modify: `backend/app/core/config.py`, `backend/app/api/router.py`, `backend/pyproject.toml` (+ `httpx` en dépendance d'exécution), `backend/.env.example`, `backend/render.yaml` (nouvelles variables secrètes)

**Interfaces:**
- Produces settings : `env: Literal["development","production"]="development"`, `app_url: str="http://localhost:3000"`, `resend_api_key: str|None=None`, `email_from: str="Soon Finance <bonjour@soonfinance.app>"`, `admin_emails: list[str]=[]` (séparés par des virgules dans l'environnement).
- Produces `send_login_link(email: str, link: str, locale: str) -> None` : sans `resend_api_key`, journalise le lien (niveau INFO) ; sinon `POST https://api.resend.com/emails`. Sujet FR « Votre lien de connexion Soon Finance » / EN « Your Soon Finance sign-in link » ; corps : une phrase, le lien, « Il est valable 15 minutes. » / « It is valid for 15 minutes. ».
- Produces `hash_token(raw: str) -> str` ; `current_user(...) -> User` (cookie `sf_session` → 401 `{"detail":"unauthenticated"}` si absent, inconnu ou expiré) dans `app/api/deps.py`.
- Produces routes :
  - `POST /api/auth/request-link` corps `{email, locale: "fr"|"en", consent: true, next: str|None}` (email : regex simple + longueur ≤ 254, minuscules ; `consent` doit valoir `true` → sinon 422 ; `next` accepté seulement s'il commence par `/` et pas `//`) → 202 `{"sent": true}` + `"dev_link"` **uniquement si `env == "development"`** ; 429 `{"detail": "rate_limited", "retry_after": <secondes>}`.
  - `GET /api/auth/verify?token=…` → valide : marque utilisé, crée l'utilisateur s'il n'existe pas (`consent_at` = maintenant, `locale` du jeton) et un événement `signup_completed` à la création, crée la session, pose le cookie, **303** vers `next_path` ou `/{locale}/tableau-de-bord` ; invalide/expiré/déjà utilisé → **303** vers `/{locale}/connexion/lien-expire` (locale `fr` si jeton inconnu).
  - `POST /api/auth/logout` → supprime la session, efface le cookie, 204.
  - `GET /api/me` → `{id, email, first_name, locale, currency, role, created_at}`.
- Le lien envoyé est `{app_url}/api/auth/verify?token=<brut>`.

- [ ] **Step 1: Write the failing tests** — `test_request_link_returns_dev_link_in_development` ; `test_request_requires_consent` (422) ; `test_request_rejects_open_redirect` (`next="//evil.com"` → 422) ; `test_token_stored_hashed` (le brut n'apparaît pas en base) ; `test_verify_creates_user_session_and_redirects` (303, `Location` = `/fr/tableau-de-bord`, cookie `sf_session` `HttpOnly`) ; `test_verify_twice_goes_to_expired` ; `test_verify_after_15_minutes_goes_to_expired` (horloge figée via une fonction `now()` injectable) ; `test_rate_limit_email` (6e demande en 1 h → 429) ; `test_me_requires_session` (401) ; `test_logout_clears_session` ; `test_existing_user_signs_in_without_duplicate`.
- [ ] **Step 2: Run** `python -m uv run pytest tests/test_auth.py -q` → FAIL.
- [ ] **Step 3: Implement** (IP hachée avec SHA-256 ; `now()` dans `app/services/auth.py` remplaçable en test).
- [ ] **Step 4: Run** `python -m uv run pytest -q` → all passed.
- [ ] **Step 5: Commit** `git commit -m "feat(backend): connexion par lien magique et sessions"`

### Task 3: Budget mensuel, bilan, profil, import de la simulation

**Files:**
- Create: `backend/app/domain/months.py`, `backend/app/schemas/budget.py`, `backend/app/api/routes/months.py`, `backend/app/api/routes/profile.py`, `backend/tests/test_months.py`
- Modify: `backend/app/api/router.py`

**Interfaces:**
- Consumes: `split`, `get_method`, `SimulationIn` (plan 1) ; `current_user` (Task 2).
- Produces `plan_envelopes(income, method, custom: list[{label, kind, pct}]|None) -> list[dict]` (prévu + enfants, via `split`) ; `month_out(m: Month) -> MonthOut` ; `MonthOut = {year_month, income, currency, method, envelopes, review: {went_well, change_next}|null, helpfulness, closed_at, editable_until, savings_rate_bp: int|null, kept: bool|null}`.
- Produces routes :
  - `POST /api/onboarding` corps = `SimulationIn` (plan 1, avec `envelopes` personnalisées acceptant aussi `label`) → met à jour le profil (`essentials`, `has_debt`, `savings`) et la devise de l'utilisateur, crée le mois courant s'il n'existe pas → 200 `MonthOut`. Idempotent.
  - `PUT /api/profile` `{essentials, has_debt, savings}` → 200.
  - `GET /api/months` → liste décroissante de `MonthOut`.
  - `GET /api/months/{ym}` → 200 / 404.
  - `PUT /api/months/{ym}` `{income, currency, method, envelopes?}` → crée ou remplace le prévu d'un mois **non clôturé** (409 `{"detail":"closed"}` sinon).
  - `POST /api/months/{ym}/close` `{actuals: list[int] (un par enveloppe, dans l'ordre), went_well: str ≤ 500|null, change_next: str ≤ 500|null, helpfulness: 1..5|null}` → 422 `{"detail":"totals_mismatch"}` si `sum(actuals) != income`, 422 si longueur différente ; 409 `{"detail":"locked"}` si clôturé depuis plus de **7 jours** ; sinon enregistre, `closed_at` (conservé si déjà clôturé), crée le mois suivant (même méthode, revenu, devise) **s'il n'existe pas**, événement `month_closed` ; renvoie `{"month": MonthOut, "previous_rate_bp": int|null, "steps": int}`.

- [ ] **Step 1: Write the failing tests** — `test_onboarding_creates_current_month_from_simulation` (500000 XOF 50/30/20 → enveloppes prévues 250000/150000/100000) ; `test_onboarding_is_idempotent` ; `test_custom_plan_keeps_labels` ; `test_close_rejects_totals_mismatch` (243000+164000+90000 → 422) ; `test_close_ok_computes_rate_and_creates_next_month` (243000/164000/93000 → `savings_rate_bp` 1860, mois suivant créé) ; `test_close_twice_does_not_duplicate_next_month` ; `test_reclose_within_7_days_updates` ; `test_reclose_after_7_days_is_locked` ; `test_put_closed_month_conflicts` ; `test_isolation_user_b_cannot_read_or_close_a_month` (404) ; `test_month_routes_require_session` (401).
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement**.
- [ ] **Step 4: Run** `python -m uv run pytest -q` → all passed.
- [ ] **Step 5: Commit** `git commit -m "feat(backend): budget mensuel, bilan et import de la simulation"`

### Task 4: Objectifs, tableau de bord, règles 6 à 9

**Files:**
- Create: `backend/app/domain/progress.py`, `backend/app/domain/account_rules.py`, `backend/app/schemas/goals.py`, `backend/app/api/routes/goals.py`, `backend/app/api/routes/dashboard.py`, `backend/tests/test_goals.py`, `backend/tests/test_dashboard.py`
- Modify: `backend/app/schemas/simulation.py` (`Suggestion.params: dict[str, int | str]`), `backend/app/api/router.py`

**Interfaces:**
- Produces `sun_steps(rates_bp: list[int]) -> int` (règle des Global Constraints) ; `goal_pace(goal, monthly_saving: int, today_ym: str) -> {monthly_needed: int, on_track: bool, projected: "YYYY-MM"|null}` (`monthly_needed` = arrondi supérieur de `(target - saved) / mois restants`, mois restants ≥ 1 ; `projected` = mois où l'objectif est atteint au rythme `monthly_saving`, null si `monthly_saving == 0`) ; `account_suggestions(user, months, goals, today_ym) -> list[Suggestion]`.
- Règles (ordre, ids exacts) : 6 `envelope-overspent` `{key}` — une même enveloppe a `actual > planned` dans chacun des **2 derniers mois clôturés** ; 7 `increase-savings` — mois tenu pour chacun des **3 derniers mois clôturés** ; 8 `goal-behind` `{goal_id, monthly_needed, projected}` — par objectif dont `on_track` est faux ; 9 `close-previous-month` `{year_month}` — le mois précédant le mois courant a un prévu non clôturé.
- Produces routes : `GET/POST /api/goals` (POST `{label ≤ 60, target > 0, deadline "YYYY-MM" ≥ mois courant, saved ≥ 0}`, maximum **3** → 409 `{"detail":"limit"}`), `PATCH/DELETE /api/goals/{id}` (404 hors propriétaire). `GoalOut = {id, label, target, deadline, saved, pace}`.
- `GET /api/dashboard` → `{first_name, currency, current_month: MonthOut|null, closed_count, steps, rates: [{year_month, savings_rate_bp}] (12 derniers clôturés, ordre chronologique), saved_total (somme des épargnes réelles des mois clôturés dans la devise courante), goals: [GoalOut], suggestions: [...règles 1-5 du mois courant (plan 1, via profil) puis règles 6-9]}`.

- [ ] **Step 1: Write the failing tests** — `test_sun_steps` (`[]→0`, `[1200]→1`, `[1200,1700,1860]→3`, `[1200,1000,1700]→2`) ; `test_goal_pace_behind` (cible 1 500 000, épargné 145 000, échéance dans 8 mois, rythme 100 000 → `monthly_needed` 169 375, `on_track` false, `projected` = mois courant + 14) ; `test_goal_limit_3` ; `test_goal_isolation` ; `test_rule_6_two_months_overspent` ; `test_rule_7_three_months_kept` ; `test_rule_9_previous_not_closed` ; `test_dashboard_empty_user` (aucune donnée → `current_month` null, `steps` 0, `suggestions` []) ; `test_dashboard_full` (3 mois de l'exemple 60 000/85 000/93 000 → `steps` 3, `saved_total` 238 000).
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement**.
- [ ] **Step 4: Run** `python -m uv run pytest -q` → all passed.
- [ ] **Step 5: Commit** `git commit -m "feat(backend): objectifs, tableau de bord, règles 6 à 9"`

### Task 5: Paramètres du compte, export, suppression, événements

**Files:**
- Create: `backend/app/api/routes/events.py`, `backend/tests/test_account.py`, `backend/tests/test_events.py`
- Modify: `backend/app/api/routes/me.py`, `backend/app/api/router.py`

**Interfaces:**
- Produces : `PATCH /api/me` `{first_name ≤ 40|null, locale, currency ∈ CURRENCIES}` (aucune conversion des mois existants) ; `GET /api/me/export` → JSON `{user, profile, months, goals}` avec `Content-Disposition: attachment; filename="soon-finance-export.json"` ; `DELETE /api/me` → suppression en cascade, cookie effacé, 204 ; `POST /api/events` `{type ∈ {"simulation_completed","comparison_viewed","signup_started"}, anon_id ≤ 64, locale, currency}` → 204 (types serveur `signup_completed`, `month_closed` refusés en entrée → 422).

- [ ] **Step 1: Write the failing tests** — `test_patch_me_changes_currency_without_conversion` ; `test_export_contains_all_user_data_only` (données de B absentes) ; `test_delete_me_removes_everything_and_session` (puis `GET /api/me` → 401) ; `test_events_accepts_whitelisted_type` ; `test_events_rejects_server_types_and_extra_fields` ; `test_events_store_no_personal_fields`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement**.
- [ ] **Step 4: Run** `python -m uv run pytest -q` → all passed.
- [ ] **Step 5: Commit** `git commit -m "feat(backend): paramètres, export, suppression, événements"`

### Task 6: Frontend — client API, protection des pages, connexion

**Files:**
- Create: `frontend/src/lib/api.ts`, `frontend/src/lib/api.test.ts`, `frontend/src/lib/use-api.ts`, `frontend/src/app/[lang]/connexion/lien-envoye/page.tsx`, `frontend/src/app/[lang]/connexion/lien-expire/page.tsx`, `frontend/src/components/auth/login-form.tsx`, `frontend/e2e/auth.spec.ts`
- Modify: `frontend/src/app/[lang]/connexion/page.tsx` (remplace la page d'attente), `frontend/src/proxy.ts` + `proxy.test.ts`, `frontend/src/components/site-header.tsx`, dictionnaires (espace `auth`)

**Interfaces:**
- Produces `apiFetch<T>(path: string, init?: RequestInit): Promise<T>` (même origine, JSON) qui lève `ApiError(status: number, detail: unknown)` ; sur 401, `redirectToLogin(locale, nextPath)` vers `/{lang}/connexion?next=<chemin courant>` ; `useApi<T>(path: string | null) → {data, error, loading, reload}`.
- Produces `ACCOUNT_PATHS = ["tableau-de-bord", "bilan", "historique", "objectifs", "parametres"]` dans `proxy.ts` : sans cookie `sf_session`, redirection vers `/{lang}/connexion?next=<chemin>`.
- Pages (maquettes `Connexion`, `LienEnvoye`, `LienExpire`) : formulaire email + consentement avec validation en ligne (messages des maquettes), envoi `POST /api/auth/request-link` (`next` repris de l'URL, `signup_started` envoyé à `/api/events`) ; en développement, si la réponse contient `dev_link`, bouton « Ouvrir le lien (développement) » ; 429 → « Trop de demandes de lien… » ; page « Vérifiez votre boîte mail » (email affiché depuis `?email=`, renvoi possible après 45 s) ; page « Ce lien a expiré ». En-tête : si cookie `sf_session` présent (lu côté serveur), lien « Mon tableau de bord » à la place de « Se connecter », plus bouton « Se déconnecter » dans le menu du compte.

- [ ] **Step 1: Write the failing tests** — vitest `api.test.ts` (`ApiError` levée avec statut et détail ; 401 appelle la redirection avec `next`) ; `proxy.test.ts` (`/fr/tableau-de-bord` sans cookie → redirection `/fr/connexion?next=%2Ffr%2Ftableau-de-bord` ; avec cookie → pas de redirection) ; e2e `auth.spec.ts` (`full magic link sign-in` : formulaire → `dev_link` → tableau de bord ; `consent required` ; `expired link page` ; `account page redirects when signed out`).
- [ ] **Step 2: Run** `npx vitest run` et `npx playwright test e2e/auth.spec.ts` → FAIL.
- [ ] **Step 3: Implement** (Playwright lance le backend avec `ENV=development` et une base SQLite temporaire migrée : `alembic upgrade head` avant `uvicorn`).
- [ ] **Step 4: Run** → passed ; `npm run lint`, `npm run build`.
- [ ] **Step 5: Commit** `git commit -m "feat(frontend): connexion par lien magique et pages protégées"`

### Task 7: Tableau de bord (premier usage et suivi) et soleil sur l'horizon

**Files:**
- Create: `frontend/src/app/[lang]/tableau-de-bord/page.tsx`, `frontend/src/components/dashboard/dashboard.tsx`, `frontend/src/components/dashboard/first-run.tsx`, `frontend/src/components/horizon/sun-horizon.tsx`, `frontend/src/components/account/account-nav.tsx`, `frontend/e2e/dashboard.spec.ts`
- Modify: `frontend/src/components/simulator/simulator.tsx` (connecté : « Enregistrer dans mon budget » → `POST /api/onboarding` puis tableau de bord), dictionnaires (espaces `dashboard`, `account`)

**Interfaces:**
- Consumes: `GET /api/dashboard`, `POST /api/onboarding`, `loadDraft()` (plan 1).
- Produces `SunHorizon({ steps: number; previousSteps?: number; size?: "md" | "lg" })` : horizon, 12 repères, soleil dont la hauteur suit `steps` (règle de la maquette : `cy = 101 - steps × 7.5` dans un `viewBox 0 0 320 112`), animé de `previousSteps` à `steps` si fourni, sans animation si `prefers-reduced-motion` ; `role="img"` + `aria-label` « Le soleil est monté de {n} crans sur 12 ».
- Produces `AccountNav` : navigation du compte (barre du bas sur mobile : Tableau, Historique, Objectifs, Apprendre ; menu latéral sur ordinateur : + Changer de méthode, Paramètres), comme les maquettes `Tableau` / `TableauDesktop`.
- Comportement : à l'ouverture, si le brouillon `sf-simulation` a un revenu > 0 et que `current_month` est null → `POST /api/onboarding` avec le brouillon puis rechargement. `closed_count == 0` → état premier usage (maquette `TableauNouveau`) ; sinon suivi (maquette `Tableau`) : titre fondé sur les données (« Votre épargne progresse depuis {premier mois} » si `steps ≥ 2`, sinon « Bonjour {prénom} »), soleil, prévu/réel du mois courant, conseils (textes des 9 règles dans le dictionnaire), objectifs, bouton « Faire le bilan de {mois} ». Sans aucune donnée ni brouillon : invitation « Faites votre première simulation » vers le simulateur.

- [ ] **Step 1: Write the failing tests** — `first run after signup imports the draft` (brouillon 500000 XOF → inscription → premier usage avec Épargne 100 000) ; `empty account invites to simulate` ; `dashboard shows sun and month` (comptes semés via l'API avec 2 mois clôturés → « 2 crans sur 12 ») ; `reduced motion has no sun animation`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement**.
- [ ] **Step 4: Run** → passed ; lint, build.
- [ ] **Step 5: Commit** `git commit -m "feat(frontend): tableau de bord et soleil sur l'horizon"`

### Task 8: Bilan du mois et écran « Un pas de plus »

**Files:**
- Create: `frontend/src/app/[lang]/bilan/[mois]/page.tsx`, `frontend/src/app/[lang]/bilan/[mois]/termine/page.tsx`, `frontend/src/components/month/close-form.tsx`, `frontend/src/components/month/month-done.tsx`, `frontend/e2e/month.spec.ts`
- Modify: dictionnaires (espace `month`)

**Interfaces:**
- Consumes: `GET /api/months/{ym}`, `POST /api/months/{ym}/close` (Task 3), `SunHorizon` (Task 7).
- Comportement (maquettes `Cloture*`, `MoisBoucle*`) : montants réels par enveloppe avec « prévu », écart coloré (avertissement si dépassement d'envie ou épargne manquante), bouton « Tout s'est passé comme prévu », total vérifié en direct (message « Il reste {x} non répartis… » / « Vos montants dépassent votre revenu de {x}… »), bilan facultatif, note 1-5 (`role="radiogroup"` libellé par la question), bouton désactivé tant que le total n'est pas juste et pendant l'envoi (pas de double envoi) ; 422 `totals_mismatch` et 409 `locked` affichent un message sans vider la saisie ; succès → `/bilan/{ym}/termine` : « Un pas de plus. » si le taux a progressé (sinon « Mois bouclé. »), soleil animé de `steps-1` à `steps`, taux précédent → nouveau, épargne du mois et cumul, « Pour novembre » avec la suggestion principale, lien vers le tableau de bord. « Mois tenu ! » affiché seulement si `kept`.

- [ ] **Step 1: Write the failing tests** — `close month happy path` (comme prévu → envoi → écran terminé avec le soleil) ; `mismatch keeps inputs` ; `locked month message` ; `double click sends once` (intercepte la route, compte 1 requête).
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement**.
- [ ] **Step 4: Run** → passed ; lint, build.
- [ ] **Step 5: Commit** `git commit -m "feat(frontend): bilan du mois et écran un pas de plus"`

### Task 9: Historique et objectifs

**Files:**
- Create: `frontend/src/app/[lang]/historique/page.tsx`, `frontend/src/app/[lang]/objectifs/page.tsx`, `frontend/src/components/history/history.tsx`, `frontend/src/components/goals/goals.tsx`, `frontend/e2e/history-goals.spec.ts`
- Modify: dictionnaires (espaces `history`, `goals`)

**Interfaces:**
- Consumes: `GET /api/months`, `GET/POST/PATCH/DELETE /api/goals`.
- Comportement (maquettes `Historique*`, `Objectifs*`) : graphique des taux d'épargne (mois clôturés pleins, mois en cours en pointillé, valeurs écrites), liste des mois (statut « Clôturé · {taux} » ou « En cours »), état vide ; objectifs avec jauge, retard expliqué (« À votre rythme, vous l'atteindrez en {mois} ») et deux actions (« Décaler à {mois} » → PATCH `deadline`, « Épargner plus chaque mois » → lien vers le simulateur), formulaire de création avec calcul en direct du montant mensuel et avertissement si > épargne prévue (« Allonger la durée »), limite de 3, suppression avec confirmation dans la page, état vide « Donnez un but à votre épargne » + préremplissage réserve d'urgence (3 × dépenses essentielles du profil).

- [ ] **Step 1: Write the failing tests** — `history lists closed months` ; `history empty state` ; `create goal shows monthly amount` ; `goal behind offers postpone` (PATCH envoie l'échéance projetée) ; `fourth goal is refused` ; `delete goal asks confirmation`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement**.
- [ ] **Step 4: Run** → passed ; lint, build.
- [ ] **Step 5: Commit** `git commit -m "feat(frontend): historique et objectifs"`

### Task 10: Paramètres et événements anonymes

**Files:**
- Create: `frontend/src/app/[lang]/parametres/page.tsx`, `frontend/src/components/settings/settings.tsx`, `frontend/src/lib/events.ts`, `frontend/e2e/settings.spec.ts`
- Modify: `frontend/src/components/simulator/simulator.tsx` et `frontend/src/components/compare/compare.tsx` (événements), dictionnaires (espace `settings`)

**Interfaces:**
- Consumes: `GET/PATCH/DELETE /api/me`, `GET /api/me/export`, `POST /api/auth/logout`, `POST /api/events`, `ThemePreferencePicker` (plan 1).
- Produces `track(type: "simulation_completed" | "comparison_viewed" | "signup_started", locale, currency)` : `anon_id` aléatoire stocké en `localStorage` (`sf-anon`), erreurs avalées, au plus un `simulation_completed` par session de navigation (`sessionStorage`).
- Comportement (maquettes `Parametres*`) : prénom, email (lecture seule), devise (« Change seulement l'affichage. Vos montants ne sont pas convertis. »), langue, apparence Auto / Clair / Sombre, « Télécharger mes données » (fichier JSON), « Supprimer mon compte » avec confirmation dans la page qui liste ce qui sera effacé, « Se déconnecter ».

- [ ] **Step 1: Write the failing tests** — `change first name and currency` ; `export downloads json` (Playwright `waitForEvent("download")`) ; `delete account confirms then signs out` (puis page protégée → connexion) ; vitest `track sends once per session and never throws`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement**.
- [ ] **Step 4: Run** toute la suite : `cd backend && python -m uv run pytest -q` ; `cd frontend && npm run lint && npx vitest run && npm run build && npx playwright test` → tout passe.
- [ ] **Step 5: Commit** `git commit -m "feat(frontend): paramètres et événements anonymes"`
