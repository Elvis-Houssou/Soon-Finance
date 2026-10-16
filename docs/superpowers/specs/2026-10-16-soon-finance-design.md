# Soon Finance — Cahier des charges (design produit)

- **Date** : 2026-10-16
- **Statut** : validé en brainstorming, en attente de relecture écrite
- **Source de contenu** : `../../../synthese_budget_epargne_seminaire.pdf` (méthodes, exemple chiffré, points de vigilance). Le volet « séminaire » du document est **hors projet**.

## 1. Vision

Soon Finance est la branche finance de la marque **Soon** (branche sœur : Soon Horizons, architecture). C'est une plateforme web **gratuite et internationale** qui aide les personnes qui ne savent pas gérer leur argent à répartir leur revenu, épargner et comprendre les bases de l'investissement.

La personne saisit son revenu, essaie et compare des méthodes de répartition, reçoit des **retours dynamiques** (montants et suggestions en direct), puis s'inscrit gratuitement pour suivre son budget mois après mois.

### Critères de réussite (dans cet ordre de mesure)

1. **C — Utilisation** : visiteurs, simulations, conversion simulation → inscription.
2. **B — Fidélité** : mois clôturés par cohorte, séries de mois tenus, retour le mois suivant.
3. **A — Épargne réelle** : évolution du taux d'épargne déclaré par utilisateur.

## 2. Périmètre

### Dans le lancement (v1)

- Site FR / EN, sélecteur de devise.
- Simulateur public sans compte (vitrine qui incite à l'inscription).
- Six méthodes de répartition, comparaison côte à côte.
- Moteur de suggestions à règles fixes.
- Inscription gratuite par **lien magique email**.
- Suivi mensuel prévu / réel, bilan, objectifs.
- Pages éducatives « Apprendre ».
- Tableau de bord d'impact anonyme et agrégé pour Soon.
- Export et suppression des données personnelles.

### Hors v1 (prévu plus tard, l'architecture ne doit pas l'empêcher)

| Fonction | Ordre prévu |
|---|---|
| Assistant IA (Claude) en complément des règles | après mesure de l'usage |
| Connexion mot de passe, puis Google, puis téléphone (SMS/WhatsApp) | dans cet ordre |
| Autres langues | à la demande |

### Exclu

Séminaires et mode de groupe, fiche imprimable / export PDF, conversion entre devises, application mobile native (le site est pensé mobile d'abord), recommandation de produits financiers précis.

## 3. Contraintes

- **Pas de conseil financier personnalisé.** Le contenu investissement reste éducatif et général (types de placement, risques, frais, horizon). Avertissement visible sur le simulateur, les suggestions et les pages Apprendre. Point à faire valider par un juriste avant lancement.
- **Devise** : l'utilisateur choisit sa devise ; tous les calculs se font dans cette devise, **sans conversion**. Formatage via `Intl.NumberFormat` (nombre de décimales selon la devise : 0 pour XOF/XAF, 2 pour EUR/USD).
- **Langues** : français et anglais dès le lancement, même mécanique que Soon Horizons (segment `[lang]`, dictionnaires typés, pas de librairie i18n).
- **Données sensibles** : un revenu est une donnée personnelle sensible. Collecte minimale, chacun ne voit que ses données.
- **Identité** : charte dans `docs/brand-guidelines.md` (vert menthe #2EF07F sur fond blanc pur, thèmes clair / sombre / auto comme Soon Horizons, vouvoiement, slogan « Chaque mois, un pas de plus. »), tokens dans `assets/design-tokens.*`.

## 4. Architecture

```
Navigateur ──► Next.js (Vercel) ──/api/*──► FastAPI (Render ou Railway) ──► Neon PostgreSQL (UE, Francfort)
                │                                │
                └ calcul des montants en direct   ├ authentification lien magique ──► Resend (emails)
                                                  ├ méthodes, règles, budgets, objectifs
                                                  └ tableau de bord d'impact
```

| Couche | Choix | Rôle |
|---|---|---|
| Interface | Next.js (App Router), React, TypeScript strict, Tailwind CSS v4 | Écrans FR/EN, calcul instantané des montants dans le navigateur |
| API | Python, **FastAPI**, Pydantic | Authentification, méthodes, moteur de suggestions, sauvegarde, impact, future IA |
| Base | **Neon** (PostgreSQL), SQLAlchemy, Alembic | Données utilisateurs et événements anonymes |
| Emails | Resend | Envoi des liens magiques |
| Trafic | Vercel Analytics | Visiteurs (indicateur C) |

- **Même origine** : Next.js relaie `/api/*` vers FastAPI (rewrites). Le navigateur ne voit qu'un domaine, donc cookies de session `httpOnly`, `Secure`, `SameSite=Lax` sans configuration CORS entre domaines.
- **Une seule définition des méthodes** : côté Python, exposée par `GET /api/methods`. L'interface ne duplique jamais une méthode.

## 5. Parcours et écrans

### Public (sans compte)

1. **Accueil** : promesse, et champ « Votre revenu mensuel » + devise dans la première section. Une première répartition s'affiche dès la saisie.
2. **Simulateur** : revenu + devise, les six méthodes en cartes avec montants en direct ; choix d'une méthode → répartition détaillée avec sous-enveloppes modifiables, alerte si le total ≠ 100 %, suggestions en direct ; comparaison de 2 ou 3 méthodes côte à côte. Trois questions facultatives (§ 6.3).
3. **Apprendre** : une fiche par méthode ; bases : épargne ≠ investissement, réserve d'urgence, risques et frais. Contenu éducatif.
4. **Pages légales** : mentions légales, confidentialité, avertissement « pas un conseil financier ».

### Avec compte gratuit

5. **Inscription / connexion** par lien magique. La simulation en cours (gardée dans le navigateur) est **rattachée au compte** à la première connexion.
6. **Tableau de bord** : budget du mois, prévu / réel par enveloppe, épargne cumulée, série de mois tenus, suggestions.
7. **Clôture du mois** : saisie des montants réels, bilan (ce qui a marché, ce que je change), note facultative « Soon Finance vous aide-t-il ? » (1 à 5). Le mois suivant est prérempli.
8. **Objectifs** : 1 à 3 objectifs (libellé, montant cible, date, montant épargné) avec progression.
9. **Paramètres** : devise, langue, prénom facultatif, export des données (JSON), suppression définitive du compte.

### Soon (rôle admin)

10. **Tableau de bord d'impact** : chiffres agrégés uniquement (§ 8).

### Ce qui distingue l'accès sans compte et avec compte

| Sans compte | Avec compte gratuit |
|---|---|
| Six méthodes, montants en direct, comparaison | Tout ce qui précède |
| **2 suggestions** + aperçu « +N autres conseils pour votre situation » | Toutes les suggestions, y compris celles fondées sur l'historique |
| Pages Apprendre | Sauvegarde, suivi mensuel, objectifs, bilan, série |

Pas de mur bloquant ni de dark pattern : la valeur est montrée, l'inscription est proposée.

## 6. Moteur de calcul et suggestions

### 6.1 Méthodes (validées)

| Clé | Méthode | Enveloppes |
|---|---|---|
| `50-30-20` | 50/30/20 | Besoins 50 %, Envies 30 %, Épargne 20 % |
| `70-20-10` | 70/20/10 | Dépenses 70 %, Épargne 20 %, Dons / dîme 10 % |
| `80-20` | 80/20 | Dépenses 80 %, Épargne 20 % |
| `six-jars` | 6 comptes (version T. Harv Eker) | Nécessités 55 %, Liberté financière 10 %, Épargne long terme 10 %, Éducation 10 %, Loisirs 10 %, Dons 5 % |
| `soon-10-70-20` | Modèle Soon 10/70/20 (inspiré de FIRE) | Dîme / dons 10 %, Épargne et investissement 70 %, Dépenses personnelles 20 % |
| `custom` | Personnalisée | Catégories et pourcentages libres, total = 100 % |

Sous-enveloppes du modèle Soon 10/70/20 (reprises du PDF, modifiables par l'utilisateur) :

- Épargne et investissement (70 %) : Investissements 50 %, Réserve d'urgence 20 %, Projets long terme / retraite 20 %, Formation financière 10 %.
- Dépenses personnelles (20 %) : Loisirs 30 %, Livres et développement personnel 25 %, Cadeaux / générosité 20 %, Bien-être 15 %, Réserve flexible 10 %.

Le **Soon 10/70/20** n'est jamais proposé par défaut et s'affiche avec l'avertissement : « Ce modèle convient si vos dépenses essentielles sont déjà couvertes. » Il n'est pas présenté comme « la » méthode FIRE.

Chaque méthode porte ses libellés FR et EN et une courte description pédagogique.

### 6.2 Calcul

- `montant = revenu × pourcentage / 100`, arrondi au nombre de décimales de la devise.
- **L'écart d'arrondi est reporté sur la plus grande enveloppe**, pour que la somme des enveloppes soit exactement égale au revenu (idem pour les sous-enveloppes vis-à-vis de leur enveloppe).
- Méthode personnalisée : alerte si le total ≠ 100 % ; impossible d'enregistrer tant que le total ≠ 100 %.
- Calcul dans le navigateur (retour instantané) et **revalidé côté Python** à l'enregistrement.

### 6.3 Questions facultatives (alimentent les règles)

1. Dépenses essentielles mensuelles (logement, nourriture, transport).
2. Dettes ou crédits en cours (oui / non).
3. Épargne actuelle (montant).

### 6.4 Règles de départ

Chaque règle : identifiant, condition, message FR/EN, priorité, besoin d'un compte (oui/non). Les règles sont écrites dans un module Python lisible ; ajouter une règle = quelques lignes. Les suggestions sont triées par priorité.

| # | Condition | Suggestion | Compte |
|---|---|---|---|
| 1 | Part laissée pour vivre < dépenses essentielles | Cette méthode ne couvre pas vos besoins essentiels : essayez 50/30/20 ou une répartition personnalisée. | non |
| 2 | Dettes déclarées | Remboursez d'abord les dettes coûteuses avant d'investir. | non |
| 3 | Épargne actuelle < 3 × dépenses essentielles | Construisez d'abord votre réserve d'urgence (3 à 6 mois de dépenses). | non |
| 4 | Part d'épargne < 10 % | Commencez par mettre 10 % de côté : c'est l'habitude qui compte. | non |
| 5 | Épargne actuelle ≥ 3 × dépenses essentielles | Votre réserve est solide : découvrez les bases de l'investissement (lien Apprendre). | non |
| 6 | Une enveloppe dépassée 2 mois de suite | Votre enveloppe X déborde : ajustez son pourcentage ou vos dépenses. | oui |
| 7 | Épargne prévue tenue 3 mois de suite | Bravo ! Essayez d'augmenter votre épargne de 5 points. | oui |
| 8 | Objectif en retard sur son rythme | Pour atteindre votre objectif à temps, mettez de côté X par mois. | oui |
| 9 | Mois précédent non clôturé | Faites le bilan de votre mois pour suivre votre progression. | oui |

La règle 1 ne s'applique que si les dépenses essentielles sont renseignées ; les règles 3 et 5, que si les dépenses essentielles **et** l'épargne actuelle le sont. La règle 2 exclut la règle 5 (pas d'invitation à investir en cas de dettes).

L'interface d'entrée du moteur (état du budget + historique → liste de suggestions) reste stable pour qu'un assistant IA puisse s'y ajouter plus tard.

## 7. Données, sécurité, vie privée

### 7.1 Modèle de données

| Table | Colonnes principales |
|---|---|
| `users` | id, email (unique), locale, currency, first_name (nullable), role (`user`/`admin`), consent_at, created_at |
| `login_tokens` | id, email, token_hash, expires_at (+15 min), used_at |
| `sessions` | id_hash, user_id, expires_at (+30 jours), created_at |
| `profiles` | user_id, essential_expenses, has_debt, current_savings |
| `months` | id, user_id, year_month (unique par user), income, method_key, planned (JSON par enveloppe/sous-enveloppe), actual (JSON), review_text, helpfulness (1-5, nullable), closed_at |
| `goals` | id, user_id, label, target_amount, deadline, saved_amount |
| `events` | id, type, occurred_at, locale, currency, anon_id (aléatoire, navigateur), aucune donnée personnelle ni montant |

Montants stockés en `NUMERIC` dans la devise de l'utilisateur. `ON DELETE CASCADE` depuis `users` sur toutes les tables liées.

### 7.2 Sécurité

- Liens magiques : jeton aléatoire, **stocké haché**, valable 15 minutes, usage unique.
- Sessions : identifiant aléatoire en cookie `httpOnly`, `Secure`, `SameSite=Lax` ; stocké haché.
- **Limite de demandes** de lien magique par email et par IP.
- **Isolation** : toutes les requêtes sur les données personnelles passent par une dépendance FastAPI unique qui filtre sur l'utilisateur connecté.
- Validation Pydantic de toutes les entrées : montants ≥ 0, pourcentages 0 à 100, total = 100 %, devise dans la liste ISO 4217 supportée, `year_month` valide.
- Routes admin réservées au rôle `admin`.

### 7.3 Vie privée

- Collecte minimale ; prénom facultatif.
- Consentement explicite à l'inscription ; page confidentialité FR/EN.
- **Export JSON** et **suppression définitive** du compte depuis les paramètres.
- Base Neon en région UE (Francfort) ; restauration à un instant donné activée.
- Le tableau de bord d'impact n'expose jamais de donnée individuelle.

## 8. Mesure d'impact

| Objectif | Indicateurs | Source |
|---|---|---|
| C. Utilisation | Visiteurs ; simulations commencées / terminées ; comparaisons ; taux simulation → inscription | Vercel Analytics + `events` |
| B. Fidélité | % d'inscrits ayant clôturé M1, M2, M3 (par cohorte d'inscription) ; série médiane ; retour M+1 | `months` |
| A. Épargne réelle | Taux d'épargne déclaré (épargne réelle ÷ revenu) et son évolution ; % d'utilisateurs dont le taux a augmenté depuis leur premier mois ; note moyenne « Soon Finance vous aide-t-il ? » | `months` |

- **Jamais d'addition entre devises** : l'impact s'exprime en pourcentages ; les montants ne s'affichent que devise par devise.
- Filtres : période, devise, langue.

## 9. Gestion des erreurs

- Revenu vide, nul ou non numérique : message en ligne, pas de calcul.
- Total personnalisé ≠ 100 % : alerte en ligne, enregistrement bloqué.
- Lien magique expiré ou déjà utilisé : page claire avec bouton « Recevoir un nouveau lien ».
- Limite de demandes atteinte : message indiquant le délai d'attente.
- API indisponible : le simulateur continue de calculer (méthodes mises en cache au build) ; les suggestions et l'enregistrement affichent un message de réessai, sans perte de la saisie.
- Échec d'envoi d'email : message d'erreur et possibilité de réessayer.

## 10. Tests

- **API (pytest)** : somme des montants = revenu pour plusieurs devises et revenus ; chaque règle se déclenche et seulement quand il faut ; utilisateur A ne peut ni lire ni modifier les données de B ; lien expiré / réutilisé refusé ; limite de demandes ; export et suppression complets ; routes admin refusées aux non-admins.
- **Interface** : tests unitaires du calcul navigateur ; un parcours de bout en bout : simuler → s'inscrire → retrouver sa simulation → clôturer un mois.
- **Design** : audit Impeccable (accessibilité WCAG AA, mobile, contrastes, états vides et d'erreur) avant lancement.

## 11. Suite du projet

1. Relecture et validation de ce cahier des charges.
2. **Marque et identité visuelle** (UI UX Pro Max `brand`, puis Design System dans Claude Design, cohérent avec Soon Horizons).
3. **Maquettes** des écrans § 5 dans Claude Design, critiquées avec Impeccable.
4. **Plan de développement** (writing-plans).
5. Développement (Ponytail pour la sobriété du code, frontend-design et Impeccable pour l'interface, Marketing skills pour les textes FR/EN et le SEO).
