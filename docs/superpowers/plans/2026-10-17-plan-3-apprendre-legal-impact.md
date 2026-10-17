# Plan 3 — Apprendre, pages légales, tableau d'impact : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Terminer les dernières pages : Apprendre (index, 6 fiches méthode, 5 articles), confidentialité et mentions légales, tableau d'impact réservé à Soon.

**Architecture:** Les contenus éducatifs sont des modules TypeScript bilingues dans `frontend/src/content/learn/` (pas de CMS) rendus par des pages serveur statiques. Le tableau d'impact lit `GET /api/admin/impact` (backend, rôle admin via `ADMIN_EMAILS`) et affiche uniquement des agrégats.

**Tech Stack:** identique au plan 2.

**Spec:** `docs/superpowers/specs/2026-10-16-soon-finance-design.md` (§3 contrainte « pas de conseil personnalisé », §5 écrans 3, 4 et 10, §7.3 vie privée, §8 mesure d'impact) · Maquettes : `Apprendre*`, `FicheMethode*`, `Confidentialite*`, `Impact*` · PDF source des méthodes : `../synthese_budget_epargne_seminaire.pdf`.

## Global Constraints

- Contenu **éducatif et général** : aucun produit financier nommé ni recommandé, aucun rendement promis ; chaque page Apprendre se termine par « Contenu éducatif, pas un conseil financier personnalisé. Vérifiez les frais, la fiscalité et la réglementation de votre pays avant de placer votre argent. » / EN équivalent.
- Charte, ton : vouvoiement, phrases courtes, pas de jargon non expliqué ; mots interdits de la charte (`docs/brand-guidelines.md` §4).
- Tableau d'impact : **jamais** de donnée individuelle ; pourcentages pour comparer entre devises ; montants seulement devise par devise ; agrégat masqué (affiché « — ») si moins de **5** utilisateurs dans le groupe.
- Admin = utilisateur dont l'email figure dans `ADMIN_EMAILS` (rôle calculé à chaque requête) ; sinon 404.
- Pages légales : les informations d'entreprise restent des marqueurs visibles `[RAISON SOCIALE]`, `[ADRESSE]`, `[N° D'IMMATRICULATION]`, `[NOM DU RESPONSABLE]`, `[EMAIL DE CONTACT]`, `[DATE]` jusqu'à ce que le propriétaire les fournisse.

## Review Focus

1. **Petit nombre d'utilisateurs** : un filtre qui isole 1 à 4 personnes ne doit révéler aucun chiffre (« — »). → Task 3.
2. **Non-admin connecté** qui tape l'URL de l'impact : 404, rien n'apparaît. → Task 3.
3. **Lien direct vers une fiche inexistante** (`/fr/apprendre/xyz`) : page 404 du site, pas d'erreur. → Task 1.
4. **Anglais** : aucun texte français dans les pages Apprendre et légales en `/en`. → Tasks 1, 2.

---

### Task 1: Apprendre — index, fiches méthode, articles

**Files:**
- Create: `frontend/src/content/learn/types.ts`, `frontend/src/content/learn/methods.ts`, `frontend/src/content/learn/articles.ts`, `frontend/src/app/[lang]/apprendre/page.tsx`, `frontend/src/app/[lang]/apprendre/[slug]/page.tsx`, `frontend/src/components/learn/article-body.tsx`, `frontend/e2e/learn.spec.ts`
- Modify: `frontend/.env.example` et le simulateur (lien « Comprendre cette méthode » toujours actif ; retirer `NEXT_PUBLIC_LEARN_ENABLED`), lien de la règle 5 (`learn-investing`) vers `/{lang}/apprendre/risques-frais-duree`, navigation (« Apprendre »), dictionnaires (espace `learn`)

**Interfaces:**
- Produces `type LearnEntry = { slug: string; kind: "method" | "basics"; minutes: number; title: Localized; summary: Localized; sections: { heading: Localized; paragraphs: Localized<string[]> }[]; example?: { methodId: string } }`.
- Slugs : fiches = ids des méthodes (`50-30-20`, `70-20-10`, `80-20`, `six-jars`, `soon-10-70-20`, `custom`) ; articles = `epargner-ou-investir`, `reserve-urgence`, `dettes-dabord`, `risques-frais-duree`, `types-de-placements`. `generateStaticParams` pour les 11 × 2 langues.
- Contenu : fiches selon la maquette `FicheMethode*` (comment ça marche, exemple chiffré sur 500 000 FCFA calculé avec `split`, pour qui, limite, lien « Essayer avec mon revenu » vers `/{lang}/simulateur?methode=<id>`) ; le modèle Soon reprend l'avertissement et les sous-enveloppes du PDF. Articles : 4 à 7 minutes de lecture, fondés sur le PDF §7 (points de vigilance) et la spec ; « types de placements » décrit des familles (épargne bancaire, tontine, obligations, actions, immobilier) avec risques, frais et horizon, sans produit nommé.
- Index selon la maquette `Apprendre*` : article « Commencer ici », les bases, les 6 méthodes ; recherche par mots dans titres et résumés (client).

- [ ] **Step 1: Write the failing tests** — `index lists 5 articles and 6 methods` ; `method sheet shows computed example` (fiche 50/30/20 : 250 000 / 150 000 / 100 000 au format fr) ; `try with my income preselects method` ; `unknown slug is 404` ; `english pages have no french` (sur `/en/apprendre` et une fiche) ; `search filters entries`.
- [ ] **Step 2: Run** `npx playwright test e2e/learn.spec.ts` → FAIL.
- [ ] **Step 3: Implement**.
- [ ] **Step 4: Run** → passed ; lint, build.
- [ ] **Step 5: Commit** `git commit -m "feat(frontend): pages Apprendre, fiches méthode et articles"`

### Task 2: Confidentialité et mentions légales

**Files:**
- Create: `frontend/src/app/[lang]/confidentialite/page.tsx`, `frontend/src/content/legal.ts`, `frontend/e2e/legal.spec.ts`
- Modify: pied de page (liens « Confidentialité » et « Mentions légales » → `#mentions`), formulaire de connexion (lien de consentement), dictionnaires

**Interfaces:**
- Contenu (maquette `Confidentialite*`) : ce que nous gardons (email, prénom facultatif, budgets, objectifs, bilans ; statistiques anonymes sans montant ni email), « Nous ne vendons, ne louons et ne partageons aucune donnée », où (UE, Francfort ; cookie de session 30 jours seulement), droits (export et suppression depuis Paramètres, lien), « pas un conseil financier », mentions légales avec les marqueurs de la contrainte globale. Sommaire avec ancres.

- [ ] **Step 1: Write the failing tests** — `privacy page reachable from footer and consent link` ; `placeholders visible` ; `english version`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement**.
- [ ] **Step 4: Run** → passed.
- [ ] **Step 5: Commit** `git commit -m "feat(frontend): confidentialité et mentions légales"`

### Task 3: Tableau d'impact (admin)

**Files:**
- Create: `backend/app/domain/impact.py`, `backend/app/api/routes/admin.py`, `backend/tests/test_impact.py`, `frontend/src/app/[lang]/admin/impact/page.tsx`, `frontend/src/components/admin/impact.tsx`, `frontend/e2e/impact.spec.ts`
- Modify: `backend/app/api/deps.py` (`admin_user`), `backend/app/api/router.py`, `frontend/src/proxy.ts` (chemin `admin` protégé comme les pages du compte), dictionnaires (espace `impact`)

**Interfaces:**
- Produces `admin_user(user = Depends(current_user)) -> User` (404 si l'email n'est pas dans `admin_emails`).
- Produces `GET /api/admin/impact?days=30|90|365&currency=<code>|all&locale=fr|en|all` → `{usage: {simulations, comparisons, signups_started, signups_completed, conversion_bp}, retention: [{cohort: "YYYY-MM", users, m1_bp, m2_bp, m3_bp}], savings: {median_rate_bp, improved_share_bp, helpfulness_avg_x100}, amounts: [{currency, saved_total}], min_group: 5}` — toute valeur calculée sur moins de 5 utilisateurs vaut `null`. Définitions : `conversion_bp` = `signups_completed × 10000 // simulations` (événements) ; cohorte = mois d'inscription, `mN_bp` = part des inscrits de la cohorte ayant clôturé leur N-ième mois ; `improved_share_bp` = part des utilisateurs ayant ≥ 2 mois clôturés dont le dernier taux > le premier ; `helpfulness_avg_x100` = moyenne des notes × 100.
- Frontend (maquette `Impact*`) : filtres période / devise / langue, sections A Épargne réelle, B Fidélité (tableau de cohortes), C Utilisation, « — » pour les valeurs `null` avec l'explication « Moins de 5 personnes : chiffre masqué pour protéger la vie privée ».

- [ ] **Step 1: Write the failing tests** — pytest `test_non_admin_gets_404` ; `test_small_groups_are_null` ; `test_conversion_and_cohorts` (jeu de données semé : 10 utilisateurs, valeurs attendues calculées dans le test) ; `test_no_individual_fields_in_response` ; e2e `admin sees impact`, `non admin gets 404 page`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement**.
- [ ] **Step 4: Run** toute la suite backend et frontend → tout passe.
- [ ] **Step 5: Commit** `git commit -m "feat: tableau d'impact réservé à Soon"`
