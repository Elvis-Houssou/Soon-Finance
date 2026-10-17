# Plan 1 — Fondations et simulateur public : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mettre en ligne la partie publique de Soon Finance (accueil, simulateur, comparaison) en FR/EN, multi-devise, thèmes clair/sombre/auto, avec une API Python qui porte les méthodes et les suggestions.

**Architecture:** Monorepo : `web/` (Next.js, rendu et calcul instantané des montants) et `api/` (FastAPI, source unique des méthodes et moteur de suggestions, sans base de données dans ce plan). Les méthodes sont exportées de Python vers un JSON committé que le site importe (le simulateur calcule même si l'API est indisponible) ; les suggestions passent par `POST /api/suggestions`, relayé par Next (`/api/*` → FastAPI, même origine). Tous les montants circulent en **unités mineures entières** (centimes ; FCFA = unité).

**Tech Stack:** Next.js 16.4.1, React 19.3.0, TypeScript strict, Tailwind CSS v4, Vitest, Playwright · Python 3.12, FastAPI, Pydantic v2, uv, pytest, httpx.

**Spec:** `docs/superpowers/specs/2026-10-16-soon-finance-design.md` · Charte : `docs/brand-guidelines.md` · Maquettes : `docs/maquettes/` (référence visuelle : `Main`, `Simulateur`, `Comparer`, `AccueilDesktop`, `SimulateurDesktop`, `ComparerDesktop`).

**Découpage du projet (3 plans) :** 1. Fondations + simulateur public (ce plan) · 2. Comptes et suivi (Neon, lien magique, tableau de bord, clôture, objectifs, historique, paramètres, événements) · 3. Apprendre, pages légales, tableau d'impact, lancement. Chaque plan livre un site qui fonctionne.

## Global Constraints

- Mêmes conventions que Soon Horizons (`../../Architecture/WebSite/CLAUDE.md`) : segment `[lang]`, `src/i18n/dictionaries/fr.ts` + `en.ts` (type de `en` dérivé de `fr`), `getLocale()`/`getDictionary()` via `next/root-params`, `src/proxy.ts`, pas de librairie i18n, aucune couleur en dur (tokens uniquement).
- Langues : `fr` (défaut) et `en`. Cookie de langue `sf-lang`. **Vouvoiement** partout en français.
- Thème : préférence `sf-theme` dans `localStorage` (`light` | `dark`, absent = automatique), appliquée par `data-theme` sur `<html>` via un script inline avant rendu ; bouton soleil/lune dans l'en-tête + choix Auto / Clair / Sombre dans le pied de page.
- Palette (charte §1) : `--brand #2EF07F` en **fond** uniquement avec texte `--on-brand #0B1410` ; vert en texte `--brand-ink #067A39` (clair) / `#2EF07F` (sombre) ; fond `#FFFFFF` ; couleurs d'enveloppe fixes : besoin `chart-3`, envie `chart-2`, épargne `chart-1`, épargne secondaire `chart-4`, don `chart-6`, formation `chart-5`. Valeurs exactes dans `docs/brand-guidelines.md`.
- Polices : Syne (titres), Instrument Sans (texte, `tabular-nums` pour les montants), IBM Plex Mono (pourcentages, codes devise), via `next/font/google`.
- Devise choisie par l'utilisateur, **jamais de conversion** ; décimales : 0 pour `XOF`, `XAF` ; 2 pour les autres devises supportées.
- Arrondi : chaque montant = arrondi au plus proche (moitié vers le haut) en unités mineures ; **l'écart est reporté sur la plus grande enveloppe** (la première en cas d'égalité) ; la somme est toujours exactement égale au revenu.
- Le modèle Soon 10/70/20 n'est jamais sélectionné par défaut et affiche : « Ce modèle convient si vos dépenses essentielles sont déjà couvertes. » / EN « This model fits if your essential expenses are already covered. »
- Mention visible sur le simulateur et le pied de page : « Contenu éducatif, pas un conseil financier personnalisé. » / EN « Educational content, not personalised financial advice. »
- Accessibilité : WCAG AA dans les deux thèmes, cibles 44 px, vrais `<button>`/`<a>`/`<label>`, mise en page fonctionnelle à 360 px.
- Revenu maximum accepté : `MAX_INCOME_MINOR = 1_000_000_000_000` (évite tout dépassement des entiers sûrs en JS).

## Review Focus

1. **Montant collé avec séparateurs** (« 1 500 000 FCFA », « 1.500.000 », « 1,500.50 € ») : le champ doit lire le bon nombre, pas 0 ni 150050000. → Task 6.
2. **API des suggestions indisponible ou lente** : les montants s'affichent quand même, le bloc conseils affiche son message d'indisponibilité, rien ne plante. → Task 8.
3. **Stockage du navigateur bloqué ou corrompu** (navigation privée, JSON invalide) : le simulateur fonctionne avec les valeurs par défaut. → Task 7.
4. **Revenu énorme ou nul** (0, 1, 10¹² FCFA) : pas de NaN, pas de dépassement, message « Entrez votre revenu… » à 0. → Tasks 2, 6, 8.
5. **Anglais** : nombres au format `500,000`, libellés plus longs sans débordement à 360 px, aucune chaîne française qui fuit. → Tasks 5, 8.

---

### Task 1: Monorepo et squelette de l'API

**Files:**
- Create: `api/pyproject.toml`, `api/src/soonfinance/__init__.py`, `api/src/soonfinance/main.py`, `api/tests/test_health.py`, `api/.python-version` (`3.12`)
- Create: `README.md` (comment lancer `api` et `web`), `.gitignore` (Python, Node, `.env*`, `.next`, `.venv`)

**Interfaces:**
- Produces: `soonfinance.main:app` (FastAPI) ; toutes les routes sous le préfixe `/api`.

- [ ] **Step 1: Write the failing test** — `test_health_returns_ok`: `TestClient(app).get("/api/health")` → status 200, JSON `{"status": "ok"}`.
- [ ] **Step 2: Run** `cd api && uv run pytest -q` → FAIL (module introuvable).
- [ ] **Step 3: Implement** : `pyproject.toml` (package `soonfinance` en layout `src/`, dépendances `fastapi`, `pydantic>=2`, dev `pytest`, `httpx`) ; `main.py` crée `app = FastAPI(title="Soon Finance API")` et `GET /api/health`.
- [ ] **Step 4: Run** `cd api && uv run pytest -q` → 1 passed.
- [ ] **Step 5: Commit** `git commit -m "feat(api): squelette FastAPI et santé"`

### Task 2: Argent et répartition (Python)

**Files:**
- Create: `api/src/soonfinance/money.py`, `shared/split-cases.json`, `api/tests/test_money.py`

**Interfaces:**
- Produces: `CURRENCIES: dict[str, int]` (code → décimales) = `XOF 0, XAF 0, EUR 2, USD 2, GBP 2, CAD 2, CHF 2, MAD 2, NGN 2, GHS 2, KES 2, ZAR 2` ; `MAX_INCOME_MINOR = 1_000_000_000_000` ; `split(income_minor: int, pcts: list[int]) -> list[int]` (lève `ValueError` si `sum(pcts) != 100`, un pourcentage hors 0–100, ou `income_minor` hors `0..MAX_INCOME_MINOR`).
- Produces: `shared/split-cases.json` = liste de `{ "income": int, "pcts": int[], "expected": int[] }`, lue aussi par le site (Task 6).

- [ ] **Step 1: Write `shared/split-cases.json`** avec exactement ces cas :

```json
[
  { "income": 50000000, "pcts": [50, 30, 20], "expected": [25000000, 15000000, 10000000] },
  { "income": 333333, "pcts": [55, 10, 10, 10, 10, 5], "expected": [183334, 33333, 33333, 33333, 33333, 16667] },
  { "income": 150050, "pcts": [50, 30, 20], "expected": [75025, 45015, 30010] },
  { "income": 1, "pcts": [50, 30, 20], "expected": [1, 0, 0] },
  { "income": 3, "pcts": [34, 33, 33], "expected": [1, 1, 1] },
  { "income": 5, "pcts": [50, 50], "expected": [2, 3] },
  { "income": 0, "pcts": [10, 70, 20], "expected": [0, 0, 0] },
  { "income": 1000000000000, "pcts": [10, 70, 20], "expected": [100000000000, 700000000000, 200000000000] }
]
```

- [ ] **Step 2: Write the failing tests** — `test_split_matches_shared_cases` (paramétré sur le JSON) ; `test_split_sum_equals_income` (pour chaque cas, `sum == income`) ; `test_split_rejects_total_not_100` (`[50, 30, 10]` → `ValueError`) ; `test_split_rejects_income_above_max` (`MAX_INCOME_MINOR + 1` → `ValueError`) ; `test_currencies_digits` (`CURRENCIES["XOF"] == 0`, `CURRENCIES["EUR"] == 2`).
- [ ] **Step 3: Run** `uv run pytest tests/test_money.py -q` → FAIL.
- [ ] **Step 4: Implement `split`** : montant `(income * p + 50) // 100` pour chaque pourcentage, puis ajouter `income - sum` à l'index du plus grand pourcentage (premier en cas d'égalité). Arithmétique entière uniquement.
- [ ] **Step 5: Run** → all passed.
- [ ] **Step 6: Commit** `git commit -m "feat(api): répartition en unités mineures et devises"`

### Task 3: Catalogue des méthodes (source unique) et export vers le site

**Files:**
- Create: `api/src/soonfinance/methods.py`, `api/src/soonfinance/export_methods.py`, `api/tests/test_methods.py`
- Create (généré, committé): `web/src/content/methods.json`
- Modify: `api/src/soonfinance/main.py` (route `GET /api/methods`)

**Interfaces:**
- Produces: `Kind = Literal["need", "want", "save", "save2", "give", "learn"]` ; `Envelope(key: str, kind: Kind, pct: int, children: list[SubEnvelope] = [])` ; `SubEnvelope(key: str, pct: int)` ; `Method(id: str, envelopes: list[Envelope], demanding: bool = False, custom: bool = False)` (Pydantic) ; `METHODS: list[Method]` ; `DEFAULT_METHOD_ID = "50-30-20"` ; `get_method(id: str) -> Method` (`KeyError` si inconnu).
- Produces: `GET /api/methods` → `{"default": "50-30-20", "methods": [...]}` (même forme que `methods.json`) ; `python -m soonfinance.export_methods <chemin>` écrit ce JSON (indentation 2, clés triées, saut de ligne final).
- Libellés : **aucun texte dans Python** ; le site traduit `methods.<id>` et `envelopes.<key>` dans ses dictionnaires (Task 5).

Données exactes (spec §6.1) :

| id | enveloppes `key:kind:pct` |
|---|---|
| `50-30-20` | `needs:need:50`, `wants:want:30`, `savings:save:20` |
| `70-20-10` | `spending:need:70`, `savings:save:20`, `giving:give:10` |
| `80-20` | `spending:need:80`, `savings:save:20` |
| `six-jars` | `necessities:need:55`, `invest:save:10`, `long-term:save2:10`, `education:learn:10`, `play:want:10`, `giving:give:5` |
| `soon-10-70-20` (`demanding`) | `giving:give:10`, `save-invest:save:70` (enfants `investments:50`, `emergency-fund:20`, `long-term-projects:20`, `financial-education:10`), `personal:need:20` (enfants `leisure:30`, `books:25`, `gifts:20`, `wellbeing:15`, `flex:10`) |
| `custom` (`custom`) | `needs:need:60`, `savings:save:25`, `pleasures:want:15` (valeurs de départ, modifiables) |

- [ ] **Step 1: Write the failing tests** — `test_each_method_sums_to_100` ; `test_children_sum_to_100_when_present` ; `test_ids` (liste exacte dans l'ordre du tableau) ; `test_default_is_not_demanding` (`get_method(DEFAULT_METHOD_ID).demanding is False`) ; `test_api_methods` (GET → 200, `default == "50-30-20"`, 6 méthodes) ; `test_committed_json_matches_export` (export en mémoire == contenu de `web/src/content/methods.json`).
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** les modèles, `METHODS`, la route et le module d'export.
- [ ] **Step 4: Generate** `cd api && uv run python -m soonfinance.export_methods ../web/src/content/methods.json`.
- [ ] **Step 5: Run** `uv run pytest -q` → all passed.
- [ ] **Step 6: Commit** `git commit -m "feat(api): catalogue des méthodes et export JSON"`

### Task 4: Moteur de suggestions (règles 1 à 5)

**Files:**
- Create: `api/src/soonfinance/suggestions.py`, `api/tests/test_suggestions.py`
- Modify: `api/src/soonfinance/main.py` (route `POST /api/suggestions`)

**Interfaces:**
- Consumes: `split`, `CURRENCIES`, `MAX_INCOME_MINOR` (Task 2) ; `get_method`, `Envelope` (Task 3).
- Produces: `SimulationIn` (Pydantic, `extra="forbid"`) : `income: int` (0..MAX), `currency: str` (∈ `CURRENCIES`), `method: str` (id connu), `envelopes: list[CustomEnvelopeIn] | None` avec `CustomEnvelopeIn(kind: Kind, pct: int)` — le nom libre reste côté site, les règles n'en ont pas besoin (obligatoire et total = 100 si `method == "custom"`, 1 à 8 enveloppes ; ignoré sinon), `essentials: int | None` (≥ 0), `has_debt: bool | None`, `savings: int | None` (≥ 0).
- Produces: `Suggestion(id: str, params: dict[str, int])` ; `suggest(sim: SimulationIn) -> list[Suggestion]` (ordre de priorité) ; `POST /api/suggestions` → `{"suggestions": [...]}` ; entrée invalide → 422.
- Définitions : `live` = somme des enveloppes de type `need`, `want`, `learn` ; `saved` = somme des types `save`, `save2`.

| ordre | id | condition | params |
|---|---|---|---|
| 1 | `essentials-not-covered` | `essentials` renseigné et `live < essentials` | `live`, `essentials` |
| 2 | `repay-debt-first` | `has_debt is True` | — |
| 3 | `build-emergency-fund` | `essentials` et `savings` renseignés et `savings < 3 × essentials` | `min` = 3×essentials, `max` = 6×essentials |
| 4 | `start-saving-10` | `income > 0` et `saved × 10 < income` | — |
| 5 | `learn-investing` | `essentials` et `savings` renseignés, `savings ≥ 3 × essentials` et `has_debt` n'est pas `True` | — |

- [ ] **Step 1: Write the failing tests** (revenu 500 000 FCFA = `500000`, devise `XOF`) :
  - `test_soon_model_not_covering_essentials` : méthode `soon-10-70-20`, essentials 300000 → premier id `essentials-not-covered`, params `{"live": 100000, "essentials": 300000}`.
  - `test_50_30_20_covers_essentials` : essentials 300000 → `essentials-not-covered` absent.
  - `test_debt_first_and_no_investing` : has_debt True, essentials 100000, savings 900000 → contient `repay-debt-first`, ne contient pas `learn-investing`.
  - `test_emergency_fund_bounds` : essentials 300000, savings 100000 → `build-emergency-fund` avec `{"min": 900000, "max": 1800000}`.
  - `test_start_saving_10` : custom `[needs:need:95, savings:save:5]` → contient `start-saving-10`.
  - `test_learn_investing` : essentials 100000, savings 300000, has_debt False → contient `learn-investing`, pas `build-emergency-fund`.
  - `test_no_optional_answers` : seulement revenu + 50-30-20 → `[]`.
  - `test_order_is_priority` : soon + essentials 300000 + has_debt True + savings 0 → ids `["essentials-not-covered", "repay-debt-first", "build-emergency-fund"]`.
  - `test_api_rejects_custom_total_95` / `test_api_rejects_unknown_currency` / `test_api_rejects_negative_income` → 422.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** `SimulationIn` (validateurs Pydantic), `suggest`, la route.
- [ ] **Step 4: Run** `uv run pytest -q` → all passed.
- [ ] **Step 5: Commit** `git commit -m "feat(api): suggestions à règles fixes"`

### Task 5: Squelette du site (langues, thème, polices, tokens, en-tête et pied de page)

**Files:**
- Create: `web/` (Next.js 16.4.1, React 19.3.0, TypeScript strict, Tailwind v4, ESLint `eslint-config-next`), `web/next.config.ts`, `web/src/proxy.ts`, `web/src/i18n/config.ts`, `web/src/i18n/server.ts`, `web/src/i18n/dictionaries/fr.ts`, `web/src/i18n/dictionaries/en.ts`, `web/src/lib/theme.ts`, `web/src/components/theme-controls.tsx`, `web/src/components/logo.tsx`, `web/src/components/site-header.tsx`, `web/src/components/site-footer.tsx`, `web/src/components/language-switcher.tsx`, `web/src/app/globals.css`, `web/src/app/[lang]/layout.tsx`, `web/src/app/[lang]/not-found.tsx`, `web/vitest.config.ts`, `web/src/proxy.test.ts`
- Modify: `README.md`

**Interfaces:**
- Produces: `locales = ["fr", "en"]`, `Locale`, `hasLocale`, `getLocale()`, `getDictionary()` (mêmes signatures que Soon Horizons) ; `Dictionary` = type de `fr.ts` avec au minimum les espaces `meta`, `nav`, `theme`, `language`, `footer`, `methods` (6 ids : `name`, `hint`, `description`), `envelopes` (toutes les clés de Task 3, sous-enveloppes comprises), `kinds` (6 types), `simulator`, `compare`, `home`, `suggestions` (5 ids de Task 4).
- Produces: `pickLocale(request): Locale` exporté de `proxy.ts` (cookie `sf-lang`, puis `Accept-Language`, puis `fr`).
- Produces: `lib/theme.ts` repris de Soon Horizons avec la clé `sf-theme` et l'événement `sf-theme-change` ; `ThemeToggle` (soleil/lune, cercle qui s'ouvre depuis le bouton via View Transitions, désactivé si `prefers-reduced-motion`) et `ThemePreferencePicker` (Auto / Clair / Sombre).
- Produces: `next.config.ts` avec `cacheComponents: true` et `rewrites` : `/api/:path*` → `${process.env.API_ORIGIN ?? "http://127.0.0.1:8000"}/api/:path*`.
- Produces: `globals.css` : tokens clair/sombre de la charte (`--bg`, `--surface`, `--sunken`, `--tint`, `--ink`, `--muted`, `--line`, `--line-input`, `--brand`, `--on-brand`, `--on-brand-muted`, `--brand-ink`, `--gold`, `--gold-ink`, `--warning`, `--danger`, `--on-danger`, `--chart-1` … `--chart-6`, `--logo-tile`, `--logo-hz`) exposés à Tailwind via `@theme inline` ; sélection de texte, caret, focus-ring (`--brand-ink`) et barres de défilement thémés.
- Libellés FR des méthodes (`name` · `hint`) : `50-30-20` « Méthode 50/30/20 » · « Équilibrée » ; `70-20-10` « Méthode 70/20/10 » · « Avec les dons » ; `80-20` « Méthode 80/20 » · « La plus simple » ; `six-jars` « Méthode des 6 comptes » · « Six enveloppes » ; `soon-10-70-20` « Modèle Soon 10/70/20 » · « Très ambitieuse » ; `custom` « Répartition personnalisée » · « À votre façon ». Descriptions et libellés d'enveloppes : ceux des maquettes `docs/maquettes/Simulateur.dc.html` (tableau `METHODS`) ; `invest` = « Investir ».

- [ ] **Step 1: Write the failing test** `proxy.test.ts` : `pickLocale` renvoie `en` pour `Accept-Language: en-GB,en;q=0.9`, `fr` pour `de-DE`, et `en` si le cookie `sf-lang=en` est présent même avec `Accept-Language: fr`.
- [ ] **Step 2: Run** `cd web && npx vitest run` → FAIL.
- [ ] **Step 3: Implement** le squelette (structure et code de Soon Horizons adaptés : préfixes `sf-`, palette Soon Finance, logo-tuile de `assets/soon-finance-icon.svg` en SVG inline avec les classes de tokens, `icon.svg` du dossier `app/`).
- [ ] **Step 4: Run** `npx vitest run` → passed ; `npm run build` → succès ; `npm run lint` → 0 erreur.
- [ ] **Step 5: Commit** `git commit -m "feat(web): squelette Next.js FR/EN, thèmes, tokens Soon Finance"`

### Task 6: Argent côté site (répartition, saisie, affichage)

**Files:**
- Create: `web/src/lib/money.ts`, `web/src/lib/money.test.ts`

**Interfaces:**
- Consumes: `shared/split-cases.json` (Task 2) ; `web/src/content/methods.json` (Task 3).
- Produces: `CURRENCIES` (mêmes codes et décimales que Task 2) ; `MAX_INCOME_MINOR = 1_000_000_000_000` ; `split(incomeMinor: number, pcts: number[]): number[]` (même règle ; si le total ≠ 100, répartit `round(income × total / 100)` pour l'affichage du mode personnalisé) ; `parseAmount(text: string, currency: string): number | null` (unités mineures ; `null` si vide ou illisible ; plafonné à `MAX_INCOME_MINOR`) ; `formatAmount(minor: number, currency: string, locale: Locale): string` (`Intl.NumberFormat`, sans symbole) ; `formatMoney(minor, currency, locale)` (avec symbole/code).

- [ ] **Step 1: Write the failing tests** :
  - `split matches shared cases` (boucle sur le JSON, égalité stricte).
  - `parseAmount` : `("500 000", "XOF") → 500000` ; `("1 500 000 FCFA", "XOF") → 1500000` ; `("1.500.000", "XOF") → 1500000` ; `("1 500,50 €", "EUR") → 150050` ; `("1,500.50", "EUR") → 150050` ; `("12,5", "EUR") → 1250` ; `("", "XOF") → null` ; `("abc", "XOF") → null` ; `("99999999999999", "XOF") → 1000000000000`.
  - `formatAmount` : `(500000, "XOF", "fr")` égal à `new Intl.NumberFormat("fr-FR").format(500000)` ; `(150050, "EUR", "en") → "1,500.50"`.
- [ ] **Step 2: Run** `npx vitest run src/lib/money.test.ts` → FAIL.
- [ ] **Step 3: Implement**. Règle de `parseAmount` : retirer tout sauf chiffres, `,` et `.` ; si la devise a des décimales et que le dernier séparateur est suivi de 1 ou 2 chiffres en fin de texte, c'est le séparateur décimal ; tous les autres séparateurs sont des milliers.
- [ ] **Step 4: Run** → passed.
- [ ] **Step 5: Commit** `git commit -m "feat(web): calcul et formatage des montants"`

### Task 7: État du simulateur (brouillon local et conseils)

**Files:**
- Create: `web/src/lib/simulation.ts`, `web/src/lib/simulation.test.ts`, `web/src/lib/use-suggestions.ts`

**Interfaces:**
- Consumes: `split`, `CURRENCIES` (Task 6) ; `methods.json` (Task 3) ; API `POST /api/suggestions` (Task 4, mêmes noms de champs).
- Produces: `type Simulation = { v: 1; income: number; currency: string; method: string; custom: { name: string; kind: Kind; pct: number }[]; essentials: number | null; hasDebt: boolean | null; savings: number | null }` ; `DEFAULT_SIMULATION` (revenu 0, devise `XOF`, méthode `50-30-20`, enveloppes personnalisées = celles de `custom` dans `methods.json`) ; `loadDraft(): Simulation` et `saveDraft(sim: Simulation): void` (clé `localStorage` `sf-simulation`, toutes les erreurs avalées) ; `allocate(sim): { key: string; label?: string; kind: Kind; pct: number; amount: number; children: { key: string; pct: number; amount: number }[] }[]` ; `totals(sim): { pct: number; live: number; saved: number }`.
- Produces: `useSuggestions(sim): { status: "idle" | "loading" | "ready" | "unavailable"; items: { id: string; params: Record<string, number> }[] }` — appel 300 ms après la dernière modification, annulé (`AbortController`) si la saisie change, corps `{income, currency, method, envelopes: custom.map(({kind, pct}) => ({kind, pct})) si méthode custom sinon null, essentials, has_debt: hasDebt, savings}`, pas d'appel si revenu 0 ou total personnalisé ≠ 100, `unavailable` sur erreur réseau, HTTP ≥ 500 ou délai > 5 s.

- [ ] **Step 1: Write the failing tests** : `loadDraft returns default when storage throws` (stub `localStorage.getItem` qui lève) ; `loadDraft returns default on invalid JSON` ; `loadDraft returns default when v !== 1` ; `saveDraft then loadDraft round-trips` ; `allocate soon model gives children amounts` (500000 XOF, `soon-10-70-20` → `save-invest` 350000 avec enfant `investments` 175000) ; `totals live/saved for 50-30-20` (500000 → live 400000, saved 100000).
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** (sous-enveloppes : `split(montant de l'enveloppe, pcts des enfants)`).
- [ ] **Step 4: Run** → passed.
- [ ] **Step 5: Commit** `git commit -m "feat(web): état du simulateur, brouillon local, conseils"`

### Task 8: Page simulateur

**Files:**
- Create: `web/src/app/[lang]/simulateur/page.tsx`, `web/src/components/simulator/simulator.tsx` (client), `web/src/components/simulator/method-picker.tsx`, `web/src/components/simulator/allocation.tsx`, `web/src/components/simulator/custom-editor.tsx`, `web/src/components/simulator/suggestions.tsx`, `web/src/app/[lang]/connexion/page.tsx` (page d'attente « Les comptes arrivent bientôt », remplacée au plan 2), `web/playwright.config.ts`, `web/e2e/simulator.spec.ts`
- Modify: dictionnaires `fr.ts`/`en.ts` (espaces `simulator`, `suggestions`)

**Interfaces:**
- Consumes: Tasks 5, 6, 7.
- Comportement (maquettes `Simulateur` / `SimulateurDesktop`) : revenu + sélecteur de devise (`<select>` des 12 devises, défaut `XOF`, changement **sans conversion**) ; questions facultatives : dépenses essentielles (aide « Loyer, nourriture, transport, factures : ce que vous ne pouvez pas éviter. »), dettes oui/non, épargne actuelle ; 6 méthodes en `role="radiogroup"` avec `name` + `hint` ; barre + légende + liste des montants (sous-enveloppes dépliables pour le modèle Soon) ; lien « Comprendre cette méthode » (vers `/[lang]/apprendre/<id>`, page créée au plan 3, lien masqué d'ici là par `NEXT_PUBLIC_LEARN_ENABLED`) ; éditeur personnalisé (renommer, choisir le type, pourcentage entier, ajouter/retirer, 1 à 8 enveloppes) avec alerte `Total : {n} %. Il reste {r} % à répartir.` / `Retirez {r} % pour revenir à 100 %.` et bouton d'enregistrement désactivé ; conseils : 2 premiers affichés, puis carte « +{n} autres conseils pour votre situation » seulement si `n > 0` ; message `unavailable` : « Les conseils sont momentanément indisponibles. Vos montants restent calculés ; réessayez dans un instant. » ; revenu 0 : « Entrez votre revenu mensuel pour voir la répartition. » ; un seul bouton d'inscription « Enregistrer ce budget gratuitement » (vers `/[lang]/connexion`) ; préremplissage par `?revenu=<unités mineures>&devise=<code>`.
- Textes FR des 5 suggestions (spec §6.4, vouvoiement, montants formatés dans la devise) : `essentials-not-covered` « Cette méthode vous laisse {live} pour vivre, moins que vos dépenses essentielles ({essentials}). Essayez 50/30/20 ou une répartition personnalisée. » ; `repay-debt-first` « Remboursez d'abord les dettes coûteuses avant d'investir. » ; `build-emergency-fund` « Construisez d'abord votre réserve d'urgence : 3 à 6 mois de dépenses essentielles, soit {min} à {max}. » ; `start-saving-10` « Commencez par mettre 10 % de côté : c'est l'habitude qui compte. » ; `learn-investing` « Votre réserve est solide : découvrez les bases de l'investissement. »

- [ ] **Step 1: Write the failing e2e tests** (`web/e2e/simulator.spec.ts`, API lancée en local par `webServer` de Playwright) :
  - `shows amounts as you type` : `/fr/simulateur`, saisir « 500 000 » → la ligne Besoins affiche le format `fr` de 250 000.
  - `soon model shows warning` : choisir « Modèle Soon 10/70/20 » → texte d'avertissement exact visible.
  - `custom total 95 disables save` : personnalisée, mettre une enveloppe à 20 au lieu de 25 → alerte « Il reste 5 % à répartir. » et bouton d'enregistrement désactivé.
  - `essentials not covered suggestion` : soon + essentiels 300 000 → suggestion `essentials-not-covered` affichée.
  - `api down keeps amounts` : route `/api/suggestions` interceptée en 503 → montants visibles + message d'indisponibilité.
  - `english formats numbers` : `/en/simulateur`, saisir « 500000 » → « 250,000 » affiché, aucun texte français dans `main`.
  - `zero income message` : champ vidé → message « Entrez votre revenu mensuel pour voir la répartition. ».
  - `mobile 360 no horizontal scroll` : viewport 360×800 → `document.documentElement.scrollWidth <= 360`.
- [ ] **Step 2: Run** `npx playwright test e2e/simulator.spec.ts` → FAIL.
- [ ] **Step 3: Implement** les composants (Server Component pour la page, `"use client"` pour `simulator.tsx` et ses enfants ; tokens et utilitaires Tailwind uniquement).
- [ ] **Step 4: Run** `npx playwright test e2e/simulator.spec.ts` → passed ; `npm run build` → succès.
- [ ] **Step 5: Commit** `git commit -m "feat(web): simulateur public"`

### Task 9: Page comparaison

**Files:**
- Create: `web/src/app/[lang]/comparer/page.tsx`, `web/src/components/compare/compare.tsx` (client), `web/e2e/compare.spec.ts`
- Modify: dictionnaires (espace `compare`)

**Interfaces:**
- Consumes: `allocate`, `totals`, `loadDraft` (Task 7) ; `formatAmount` (Task 6).
- Comportement (maquettes `Comparer` / `ComparerDesktop`) : 2 à 3 méthodes (paramètre `?m=50-30-20,70-20-10,soon-10-70-20`, défaut ces trois), puces retirables (`aria-label` « Retirer {méthode} ») et « + Ajouter » (désactivé à 3), cibles 44 px ; par carte : barre + légende, « Pour vivre » (`live`), « Épargne / an » (`saved × 12`), verdict « Couvre vos besoins » si `essentials` absent ou `live ≥ essentials`, sinon « Trop serré pour vous » + « Il vous manquerait {manque} par mois pour vos dépenses essentielles. » ; bouton « Choisir cette méthode » → `/[lang]/simulateur` avec la méthode enregistrée dans le brouillon ; revenu et essentiels lus du brouillon, avec un champ revenu si le brouillon est vide.

- [ ] **Step 1: Write the failing e2e tests** : `verdict too tight for soon` (brouillon 500000 XOF + essentiels 300000 → carte Soon « Trop serré pour vous » et manque formaté de 200 000) ; `remove and add method` (retirer 70/20/10 → 2 cartes ; ajouter 80/20 → 3 cartes ; « + Ajouter » désactivé) ; `choose method updates simulator` (« Choisir cette méthode » sur 70/20/10 → simulateur avec 70/20/10 coché).
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement**.
- [ ] **Step 4: Run** → passed.
- [ ] **Step 5: Commit** `git commit -m "feat(web): comparaison des méthodes"`

### Task 10: Page d'accueil

**Files:**
- Create: `web/src/app/[lang]/page.tsx`, `web/src/components/home/quick-start.tsx` (client), `web/e2e/home.spec.ts`
- Modify: dictionnaires (espace `home`, textes des maquettes `Main` / `AccueilDesktop`)

**Interfaces:**
- Consumes: `parseAmount`, `split`, `formatAmount` (Task 6) ; `methods.json`.
- Comportement : titre « Chaque mois, un pas de plus. » / EN « One step further, every month. » ; essai rapide (revenu + devise → aperçu 50/30/20 avec légende, bouton « Essayer les 6 méthodes » → `/[lang]/simulateur?revenu=…&devise=…`) ; sections « Six méthodes, expliquées simplement », « Comment ça marche » (3 étapes numérotées), bandeau « Gratuit. Sans publicité. Sans rien à vendre. » ; métadonnées FR/EN et `alternates` comme Soon Horizons.

- [ ] **Step 1: Write the failing e2e tests** : `quick start carries income` (saisir « 500 000 » → aperçu Épargne au format de 100 000 ; clic → URL contient `revenu=500000&devise=XOF`, simulateur prérempli) ; `language switch keeps page` (`/fr` → bouton EN → `/en`, titre anglais) ; `theme toggle persists` (clic soleil/lune → `data-theme="dark"` sur `<html>`, conservé après rechargement).
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement**.
- [ ] **Step 4: Run** `npx playwright test` → toute la suite passe.
- [ ] **Step 5: Commit** `git commit -m "feat(web): page d'accueil"`

### Task 11: Intégration continue et déploiement

**Files:**
- Create: `.github/workflows/ci.yml`, `api/render.yaml`, `web/.env.example` (`API_ORIGIN=`, `NEXT_PUBLIC_LEARN_ENABLED=false`), `api/.env.example`
- Modify: `README.md` (déploiement : site sur Vercel avec `API_ORIGIN` = URL Render ; API sur Render, commande `uvicorn soonfinance.main:app --host 0.0.0.0 --port $PORT`)

**Interfaces:**
- CI (push et PR) : job `api` (`uv sync`, `uv run pytest -q`, vérifie que `methods.json` exporté = committé) ; job `web` (`npm ci`, `npm run lint`, `npx vitest run`, `npm run build`, `npx playwright install --with-deps chromium`, `npx playwright test` avec l'API démarrée en arrière-plan).

- [ ] **Step 1: Push** une branche et ouvrir une PR → les deux jobs passent au vert.
- [ ] **Step 2: Deploy** API sur Render puis site sur Vercel (comptes fournis par vous) → `GET https://<api>/api/health` renvoie `{"status":"ok"}` ; le simulateur en ligne affiche des conseils.
- [ ] **Step 3: Commit** `git commit -m "chore: CI et déploiement"`

---

## Plans suivants (à écrire après validation de celui-ci)

- **Plan 2 — Comptes et suivi** : Neon + SQLAlchemy + Alembic (tables spec §7.1), lien magique (Resend, jetons hachés 15 min, limite de demandes), sessions cookie `httpOnly`, isolation par utilisateur (test A ne lit pas B), reprise du brouillon `sf-simulation` à l'inscription, tableau de bord (premier usage + soleil sur l'horizon), clôture du mois et écran « Un pas de plus », objectifs, historique, règles 6 à 9, paramètres (export JSON, suppression), événements anonymes.
- **Plan 3 — Apprendre, légal, impact, lancement** : fiches des 6 méthodes et articles, pages confidentialité / mentions, tableau d'impact admin (indicateurs C, B, A en pourcentages), Vercel Analytics, SEO, audits Impeccable et sécurité, mise en ligne.
