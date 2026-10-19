# Plan 4 — Motion design et expérience interactive : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre toute l'interface de Soon Finance spectaculaire et vivante — motion design sur chaque page, moments signature (le soleil qui se lève sur l'horizon), montants qui défilent, transitions de pages, micro-interactions — sans rien perdre en lisibilité, accessibilité ni performance.

**Direction validée par l'utilisateur (2026-10-19) :** intensité « spectaculaire partout » ; moments signature sur l'accueil, le simulateur, le tableau de bord, « Un pas de plus » et toutes les pages ; bibliothèque **GSAP**. Skills mobilisés : UI UX Pro Max (règles UX/animation), frontend-design (un fil conducteur fort, pas d'effets génériques), Impeccable (`animate`, puis `polish` et détecteur).

**Fil conducteur (motion thesis) :** *l'horizon*. Tout mouvement raconte « chaque mois, un pas de plus » : les choses **montent** depuis une ligne d'horizon (masques `clip-path` qui se lèvent, pas de fondu-glissé générique), la lumière **dorée** du soleil marque les réussites, la menthe marque l'action. Les montants **comptent** jusqu'à leur valeur. Les répartitions **se recomposent** (Flip) au lieu de sauter.

**Architecture:** `gsap` + `@gsap/react` (`useGSAP`) ; plugins gratuits enregistrés une seule fois dans `frontend/src/lib/motion.ts` (`ScrollTrigger`, `SplitText`, `Flip`, `DrawSVGPlugin`, `MorphSVGPlugin` si utile) ; primitives réutilisables dans `frontend/src/components/motion/` ; chaque composant client anime via `useGSAP` avec `gsap.matchMedia()` pour le chemin `prefers-reduced-motion`. Transitions de pages via `app/[lang]/template.tsx`.

**Tech Stack:** identique au plan 3 + `gsap@3.13.0`, `@gsap/react@2.1.2` (versions exactes).

**Spec :** `docs/superpowers/specs/2026-10-16-soon-finance-design.md` · Charte : `docs/brand-guidelines.md` (palette et typo **inchangées**) · Maquettes : `docs/maquettes/`.

## Global Constraints

- **Marque inchangée** : tokens existants uniquement (menthe `--brand` en aplat avec texte `--on-brand`, encre verte `--brand-ink` pour le texte, or `--gold` pour le soleil) ; Syne / Instrument Sans / IBM Plex Mono ; clair, sombre, auto. Aucun nouveau hex dans les composants.
- **Contenu visible par défaut** : rien n'est caché sans JavaScript ; aucun texte n'est masqué au rendu serveur (les états initiaux d'animation sont posés par GSAP au montage, pas par CSS). Aucun décalage de mise en page (CLS < 0,1) : n'animer que `transform`, `opacity`, `clip-path`, `filter` bornés, propriétés SVG ; jamais `width/height/top/left/margin`.
- **Mouvement réduit** : chaque animation a un chemin `prefers-reduced-motion: reduce` via `gsap.matchMedia()` — pas de déplacement spatial ni de défilement de chiffres (valeur finale immédiate), on garde les changements d'opacité/couleur qui portent du sens. Les boucles non essentielles s'arrêtent hors écran et sous mouvement réduit.
- **Durées** : retour d'action 100–150 ms ; changement d'état 150–300 ms ; transition de vue 300–500 ms ; moment signature 500–1 200 ms (jamais bloquant : l'utilisateur peut interagir pendant). Sortie plus rapide que l'entrée. Courbes : `power3.out` / `expo.out` pour les arrivées ; pas de rebond sur les données chiffrées.
- **Montants** : `CountUp` formate à chaque image avec les fonctions existantes de `src/lib/money.ts` (devise, décimales) ; la valeur exacte finale est toujours celle affichée à la fin et exposée aux lecteurs d'écran (pas d'annonce des valeurs intermédiaires).
- **Nettoyage** : tout via `useGSAP` (contexte révoqué au démontage) ; pas de fuite de `ScrollTrigger` entre pages ; `ScrollTrigger.refresh()` après changement de mise en page connu.
- **Tests** : Playwright tourne par défaut avec `reducedMotion: "reduce"` (les tests existants restent déterministes) ; des tests dédiés en `no-preference` vérifient que les animations ont lieu et se terminent dans l'état final exact. Vitest pour les primitives. Toutes les suites restent vertes : `python -m uv run pytest -q` (backend), `npm run lint && npx vitest run && npm run build && npx playwright test` (frontend).
- **Accessibilité** : 44 px, focus visible, 360 px sans défilement horizontal, `role="status"` pour les annonces, contraste 4,5:1 conservé pendant et après les animations.
- **Performance** : GSAP chargé uniquement côté client ; plugins importés depuis `src/lib/motion.ts` seulement ; pas de `will-change` permanent ; budget JS ajouté ≤ 80 Ko gzip au total.

## Review Focus

1. **Mouvement réduit** : avec `prefers-reduced-motion: reduce`, chaque page s'affiche dans son état final sans déplacement ni compteur ; rien n'est invisible. → toutes les tâches.
2. **Chiffres exacts** : après chaque `CountUp`, le texte affiché est strictement identique au formatage de `money.ts` ; aucune valeur intermédiaire n'est annoncée. → Tasks 1, 3, 4, 5.
3. **Navigation rapide** : changer de page ou de méthode pendant une animation ne laisse ni élément figé à mi-course, ni `ScrollTrigger` orphelin, ni erreur console. → Tasks 1, 3.
4. **Sans JavaScript / hydratation lente** : contenu lisible dès le HTML serveur. → Task 1.

---

### Task 1: Fondations motion (GSAP, primitives, transitions de pages)

**Files:**
- Create: `frontend/src/lib/motion.ts`, `frontend/src/lib/motion.test.ts`, `frontend/src/components/motion/count-up.tsx`, `frontend/src/components/motion/horizon-reveal.tsx`, `frontend/src/components/motion/split-heading.tsx`, `frontend/src/components/motion/stagger-list.tsx`, `frontend/src/components/motion/press.tsx`, `frontend/src/app/[lang]/template.tsx`, `frontend/e2e/motion.spec.ts`
- Modify: `frontend/package.json` (`gsap@3.13.0`, `@gsap/react@2.1.2`), `frontend/playwright.config.ts` (`use.reducedMotion: "reduce"` par défaut), `frontend/src/app/globals.css` (règle `prefers-reduced-motion` existante à garder cohérente)

**Interfaces:**
- `lib/motion.ts` : enregistre les plugins une fois (`"use client"`), exporte `gsap`, `ScrollTrigger`, `SplitText`, `Flip`, `EASE = { out: "power3.out", expo: "expo.out", inOut: "power2.inOut" }`, `DUR = { feedback: 0.12, state: 0.24, view: 0.42, signature: 0.9 }`, `REDUCED = "(prefers-reduced-motion: reduce)"`, `MOTION_OK = "(prefers-reduced-motion: no-preference)"`, `countFrames(from, to, format) → string[]` (pure, testable).
- `<CountUp value: number; from?: number; format: (n: number) => string; duration?: number; className?>` : défile de `from` (défaut : dernière valeur affichée, 0 au premier rendu) à `value` ; rendu serveur = valeur finale formatée ; `aria-live` absent, texte final exact ; mouvement réduit → saut direct.
- `<HorizonReveal as? delay? trigger?: "mount" | "scroll">` : révèle ses enfants en levant un masque `clip-path: inset(100% 0 0 0) → inset(0)` combiné à un `y` léger, comme un astre qui passe l'horizon ; `scroll` via `ScrollTrigger` (une fois).
- `<SplitHeading as text>` : titre découpé par mots (SplitText, `aria-label` = texte entier, mots `aria-hidden`), mots qui montent derrière une ligne d'horizon ; revert à la fin.
- `<StaggerList>` : enfants directs en cascade (total ≤ 400 ms).
- `<Press>` (ou hook `usePress`) : retour tactile 120 ms (`scale 0.97`) pour boutons et cartes cliquables.
- `template.tsx` : transition d'entrée de page (le contenu principal monte depuis l'horizon 380 ms, un trait d'horizon menthe balaie le haut de page) ; sortie implicite ; mouvement réduit → fondu 150 ms.

- [ ] **Step 1: Write the failing tests** — vitest `countFrames` (extrémités exactes, monotone, formatage XOF/EUR) et rendu de `CountUp` = valeur finale ; e2e `motion.spec.ts` : `reduced motion shows final state` (accueil, tableau de bord : aucun élément `opacity < 1` après chargement, montants exacts), `page transition runs and settles` (`no-preference` : le `main` atteint `opacity 1` et `transform none`), `no orphan ScrollTrigger after navigation` (`ScrollTrigger.getAll().length` revient à la base après aller-retour), `content visible without JS` (`javaScriptEnabled: false` sur l'accueil : titres visibles).
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** toutes les suites → passed.
- [ ] **Step 5: Commit** `git commit -m "feat(frontend): fondations motion GSAP et transitions de pages"`

### Task 2: Accueil — hero signature « lever de soleil »

**Files:**
- Create: `frontend/src/components/home/hero-sunrise.tsx`, `frontend/src/components/home/how-it-works.tsx` (si la section existe déjà sous une autre forme, la réutiliser)
- Modify: `frontend/src/app/[lang]/page.tsx`, `frontend/src/components/home/quick-start.tsx`, `frontend/src/components/logo.tsx`, `frontend/e2e/home.spec.ts`

**Comportement :**
- Hero : scène SVG plein cadre (tokens uniquement) — ligne d'horizon tracée (DrawSVG), le soleil or se lève derrière, sa lumière teinte doucement le ciel (dégradé de `--tint` vers transparent), les trois barres du logo poussent du sol en cascade ; le slogan « Chaque mois, un pas de plus. » monte mot par mot (`SplitHeading`) ; le CTA principal arrive en dernier. Durée totale ≤ 1,4 s, interactif dès 0 s.
- Quick-start : la saisie du revenu fait défiler en direct les montants de l'exemple (`CountUp`) et la barre de répartition se recompose.
- Défilement : la section « comment ça marche » épingle l'horizon (`ScrollTrigger pin`, desktop ≥ 1024 px seulement) pendant que les 3 étapes passent ; le soleil monte d'un cran à chaque étape. Mobile : simples `HorizonReveal` au scroll.
- Logo : au survol, le soleil du logo monte légèrement (150 ms).

- [ ] **Step 1: Tests** — e2e `hero animates then settles` (`no-preference` : soleil à sa position finale, slogan lisible en entier) ; `hero static under reduced motion` ; `quick start updates amounts` ; `pinned section only on desktop` (360 px : pas de `pin-spacer`) ; 360 px sans défilement horizontal.
- [ ] **Step 2–4: Run → FAIL ; implement ; run all → passed.**
- [ ] **Step 5: Commit** `git commit -m "feat(frontend): hero lever de soleil et accueil animé"`

### Task 3: Simulateur et comparateur — répartition vivante

**Files:**
- Modify: `frontend/src/components/simulator/{simulator,allocation,allocation-bar,method-picker,custom-editor,suggestions}.tsx`, `frontend/src/components/compare/compare.tsx`, `frontend/e2e/simulator.spec.ts`, `frontend/e2e/compare.spec.ts`

**Comportement :**
- Barre de répartition : à chaque changement de méthode ou de pourcentage, les segments se recomposent (`Flip` ou interpolation de `scaleX` dans un conteneur à largeur fixe), les libellés suivent ; le segment épargne reçoit un éclat menthe bref quand il grandit.
- Montants par enveloppe : `CountUp` depuis la valeur précédente.
- Choix de méthode : la carte sélectionnée « s'allume » (contour menthe dessiné, indicateur qui glisse d'une carte à l'autre via `Flip`) ; `Press` sur toutes les cartes.
- Éditeur personnalisé : ajout/suppression d'enveloppe avec entrée/sortie animées ; total qui passe au vert (or si parfait) quand il atteint 100 %.
- Conseils : arrivée en cascade quand ils changent ; un conseil nouveau pulse une fois.
- Comparateur : les colonnes se réordonnent avec `Flip` quand le revenu change ; barres comparées qui grandissent ; meilleure épargne marquée d'un petit soleil or qui se lève.

- [ ] **Step 1: Tests** — e2e `switching method recomposes bar and ends exact` (`no-preference` : montants finaux exacts), `rapid switching leaves no stale state` (5 changements rapides → état final cohérent, pas d'erreur console), `reduced motion instant`, compare `reorders with animation and exact values`.
- [ ] **Step 2–4.**
- [ ] **Step 5: Commit** `git commit -m "feat(frontend): simulateur et comparateur animés"`

### Task 4: Soleil sur l'horizon et tableau de bord

**Files:**
- Modify: `frontend/src/components/horizon/sun-horizon.tsx`, `frontend/src/components/dashboard/{dashboard,first-run}.tsx`, `frontend/src/components/account/account-nav.tsx`, `frontend/e2e/dashboard.spec.ts`

**Comportement :**
- `SunHorizon` devient la pièce maîtresse : le soleil suit un arc (pas une verticale) jusqu'à `cy = 101 - steps × 7.5` (règle conservée), halo or qui respire lentement (boucle arrêtée hors écran et sous mouvement réduit), les crans atteints s'allument un par un, le ciel se réchauffe avec la hauteur (opacité d'un dégradé `--tint`/`--gold`) ; `previousSteps → steps` animé ; API publique inchangée (+ `animateOnMount?: boolean`).
- Tableau de bord : à l'ouverture, chorégraphie unique — le soleil rejoint sa hauteur, puis prévu/réel du mois `CountUp`, les jauges d'objectifs se remplissent (`scaleX`), les conseils arrivent en cascade. Premier usage : l'horizon vide, un soleil qui pointe à peine, invitation animée.
- Navigation du compte : indicateur actif qui glisse entre les onglets (barre du bas mobile et menu latéral desktop).

- [ ] **Step 1: Tests** — e2e `sun reaches exact height` (`no-preference`, attendre la fin : `cy`/transform final = règle), `dashboard amounts exact after count`, `nav indicator follows route`, `reduced motion: no animation`, 360 px.
- [ ] **Step 2–4.**
- [ ] **Step 5: Commit** `git commit -m "feat(frontend): soleil sur l'horizon vivant et tableau de bord animé"`

### Task 5: Bilan du mois et « Un pas de plus » — la célébration

**Files:**
- Modify: `frontend/src/components/month/{close-form,month-done}.tsx`, `frontend/e2e/month.spec.ts`

**Comportement :**
- Bilan : jauge de total vivante (remplissage qui suit la saisie, couleur avertissement si dépassement, menthe quand juste) ; « Tout s'est passé comme prévu » remplit les champs en cascade ; note 1–5 avec soleils qui s'allument jusqu'à la note ; bouton « Clôturer » qui se transforme en progression pendant l'envoi.
- « Un pas de plus » : séquence signature ≤ 2,5 s, passable (clic ou touche ⇒ état final) — l'écran s'assombrit légèrement, le soleil monte de `steps-1` à `steps` en suivant son arc, éclat de lumière or (rayons radiaux SVG neutres, pas d'emblème), le titre « Un pas de plus. » se révèle mot à mot, le taux précédent → nouveau `CountUp`, épargne du mois et cumul `CountUp`, « Mois tenu ! » arrive comme un tampon (seulement si `kept`), puis « Pour {mois} » et le lien. « Mois bouclé. » : même scène, plus calme (pas d'éclat).

- [ ] **Step 1: Tests** — e2e `celebration plays and settles with exact numbers`, `skip jumps to final state`, `reduced motion shows final scene at once`, `kept stamp only when kept`, close-form `total gauge reflects input`.
- [ ] **Step 2–4.**
- [ ] **Step 5: Commit** `git commit -m "feat(frontend): bilan animé et célébration un pas de plus"`

### Task 6: Historique et objectifs

**Files:**
- Modify: `frontend/src/components/history/history.tsx`, `frontend/src/components/goals/goals.tsx`, `frontend/e2e/history-goals.spec.ts`

**Comportement :**
- Historique : les barres de taux poussent depuis l'axe en cascade (gauche → droite), valeurs `CountUp` ; le mois en cours en pointillé qui « respire » ; la liste des mois arrive en cascade ; survol/focus d'une barre met en évidence la ligne correspondante de la liste et inversement.
- Objectifs : jauges qui se remplissent, montant mensuel du formulaire `CountUp` en direct, avertissement « Allonger la durée » qui glisse ; « Décaler à {mois} » : la jauge et l'échéance se mettent à jour avec un `Flip` ; suppression : la carte se replie (Flip de la liste) après confirmation ; création : la nouvelle carte se lève depuis le formulaire.

- [ ] **Step 1: Tests** — e2e `bars grow and values exact`, `delete collapses card`, `postpone animates and shows new deadline`, reduced motion, 360 px.
- [ ] **Step 2–4.**
- [ ] **Step 5: Commit** `git commit -m "feat(frontend): historique et objectifs animés"`

### Task 7: Connexion, paramètres, Apprendre, confidentialité, impact, 404

**Files:**
- Modify: `frontend/src/components/auth/login-form.tsx`, `frontend/src/app/[lang]/connexion/**`, `frontend/src/components/settings/settings.tsx`, `frontend/src/components/theme-controls.tsx`, `frontend/src/components/learn/{learn-index,article-body}.tsx`, `frontend/src/app/[lang]/confidentialite/page.tsx`, `frontend/src/components/admin/impact.tsx`, `frontend/src/app/global-not-found.tsx`, `frontend/src/components/site-header.tsx`, e2e correspondants

**Comportement :**
- Connexion : à l'envoi, l'enveloppe s'envole vers l'horizon puis l'écran « Vérifiez votre boîte mail » se lève ; compte à rebours de renvoi en anneau qui se vide ; erreurs de champ avec léger tremblement horizontal (≤ 6 px, désactivé sous mouvement réduit).
- Thème : bascule clair/sombre par View Transition (cercle qui s'ouvre depuis le bouton) avec repli instantané si non supporté ou mouvement réduit.
- Paramètres : sections qui s'ouvrent/se ferment avec hauteur animée via `Flip` ; confirmation de suppression qui se déplie.
- Apprendre : la recherche filtre avec `Flip` (cartes qui se réorganisent) ; dans un article, barre de progression de lecture menthe le long de l'horizon en haut de page (`ScrollTrigger scrub`) ; titres de sections `HorizonReveal` au scroll ; exemple chiffré `CountUp`.
- Confidentialité : sommaire qui suit la lecture (section active surlignée, indicateur qui glisse).
- Impact : chiffres `CountUp`, cohortes qui se remplissent, « — » qui apparaît sans animation (une valeur masquée ne doit pas sembler « compter »).
- 404 : page avec en-tête et pied du site (corrige le minor du plan 3), soleil qui se couche derrière l'horizon, langue correcte aussi pour `/en/xyz`.
- En-tête : se compacte au scroll (hauteur via `transform`, pas de reflow), menu mobile qui se déplie depuis l'horizon.

- [ ] **Step 1: Tests** — e2e par page : animation `no-preference` qui se termine dans l'état attendu, chemin mouvement réduit, 360 px ; `theme switch keeps contrast` ; `/en/xyz` 404 en anglais avec en-tête.
- [ ] **Step 2–4.**
- [ ] **Step 5: Commit** `git commit -m "feat(frontend): motion design des pages connexion, paramètres, apprendre, confidentialité, impact, 404"`

### Task 8: Passe Impeccable — détecteur, polish, performance

**Files:**
- Modify: selon les constats.

- [ ] **Step 1:** lancer le détecteur Impeccable sur `frontend/src` (`impeccable detect --json`), corriger chaque constat bloquant.
- [ ] **Step 2:** passe `polish` : cohérence des durées/courbes (tout via `DUR`/`EASE`), focus visibles pendant et après animation, aucun `will-change` permanent, aucune boucle active hors écran.
- [ ] **Step 3:** performance : `npm run build` — mesurer le JS ajouté (≤ 80 Ko gzip), vérifier qu'aucune page serveur n'importe GSAP ; Lighthouse/trace locale sur l'accueil et le tableau de bord (CLS < 0,1).
- [ ] **Step 4:** toutes les suites → passed.
- [ ] **Step 5: Commit** `git commit -m "chore(frontend): passe polish motion design"`
