# Soon Finance — Brand Guidelines v1.0

> Last updated: 2026-10-16
> Status: Draft — à valider
> Famille : marque **Soon** (branche sœur : Soon Horizons, architecture)

## Quick Reference

| Element | Value |
|---------|-------|
| Primary Color | #1F4D3A |
| Secondary Color | #C9A26B |
| Primary Font | Instrument Sans |
| Display Font | Syne |
| Voice | Rassurant, Pédagogue, Encourageant, Honnête |
| Slogan | Chaque mois, un pas de plus. / One step further, every month. |

---

## 0. Plateforme de marque

### Mission
Nous aidons les personnes qui n'ont jamais appris à gérer leur argent à répartir leur revenu, épargner et comprendre l'investissement, gratuitement et dans leur propre devise, pour qu'elles avancent un peu plus chaque mois.

### Vision
Un monde où savoir gérer son argent n'est plus un privilège réservé à ceux qui l'ont appris en famille ou à l'école.

### Proposition de valeur
Pour les personnes qui reçoivent un revenu mais ne savent pas comment le répartir, Soon Finance est une plateforme gratuite de budget et d'épargne qui transforme un salaire en un plan concret en quelques secondes. Contrairement aux applications bancaires et aux tableurs, elle explique chaque méthode, compare les approches et accompagne mois après mois, sans jargon et sans rien vendre.

### Positionnement
Soon Finance est le coach budget gratuit pour les débutants en finances personnelles qui veulent enfin épargner, parce que chaque recommandation est expliquée, chiffrée dans leur devise et suivie dans le temps.

### Messages clés

| Message | Besoin | Preuve |
|---------|--------|--------|
| Votre salaire, réparti en quelques secondes. | « Je ne sais pas par où commencer. » | Simulateur instantané, six méthodes |
| Comparez avant de choisir. | « Quelle méthode me convient ? » | Comparaison côte à côte, avertissements honnêtes |
| Chaque mois, un pas de plus. | « Je n'arrive pas à tenir. » | Suivi prévu / réel, bilan, série de mois tenus |
| Gratuit, sans rien à vendre. | « Où est le piège ? » | Aucun produit financier vendu, pas de publicité |
| Vos données restent les vôtres. | « Mon salaire, c'est privé. » | Export et suppression en un clic, chiffres d'impact anonymes |

### Pitchs
- **10 s** : Soon Finance transforme votre salaire en plan d'épargne en quelques secondes, gratuitement.
- **30 s** : Beaucoup de gens gagnent leur vie sans jamais avoir appris à gérer leur argent. Soon Finance leur propose six méthodes éprouvées, calcule la répartition dans leur devise, explique chaque choix et les accompagne mois après mois. C'est gratuit, et rien n'est à vendre.

### Architecture de marque

| Branche | Signe | Couleur dominante |
|---------|-------|-------------------|
| Soon Horizons | Soleil posé **sur** l'horizon | Nuit / or |
| Soon Finance | Soleil qui **monte au-dessus** de l'horizon, porté par trois barres croissantes | Vert forêt / or |

Éléments partagés : ligne d'horizon, or Soon #C9A26B, crème #F4F1EB, Syne + Instrument Sans + IBM Plex Mono, mot « soon » en minuscules.

---

## 1. Color Palette

### Primary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Forest | #1F4D3A | rgb(31,77,58) | CTAs, titres, liens, marque |
| Forest Dark | #163A2B | rgb(22,58,43) | Survol, emphase |
| Forest Tint | #E3ECE6 | rgb(227,236,230) | Fonds de cartes actives, sélection |

### Secondary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Soon Gold | #C9A26B | rgb(201,162,107) | Soleil du logo, décor, graphiques, jamais pour du texte sur fond clair |
| Gold Ink | #7D6442 | rgb(125,100,66) | Texte doré sur fond clair (4.94:1) |

### Neutral Palette

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Background | #F4F1EB | rgb(244,241,235) | Fond de page (crème Soon) |
| Surface | #FFFFFF | rgb(255,255,255) | Cartes, champs de saisie |
| Text Primary | #141414 | rgb(20,20,20) | Texte courant |
| Text Secondary | #6B665E | rgb(107,102,94) | Légendes, aides |
| Border | #DDD7CC | rgb(221,215,204) | Séparateurs, bordures |

### Semantic Colors

| State | Hex | Usage |
|-------|-----|-------|
| Success | #1F4D3A | Objectif atteint, mois tenu (la couleur de marque porte le positif) |
| Warning | #865A0C | Total ≠ 100 %, méthode exigeante, enveloppe proche de la limite |
| Error | #B3261E | Erreurs, dépassement, suppression |
| Info | #2F5D8A | Informations, liens pédagogiques |

### Dark Mode

| Name | Hex | Usage |
|------|-----|-------|
| Background | #0D1411 | Fond |
| Surface | #15201B | Cartes |
| Text Primary | #EDEAE4 | Texte (15.54:1) |
| Text Secondary | #9AA39D | Légendes (7.20:1) |
| Primary | #7FBF9B | CTAs, liens (8.73:1), texte des boutons #0D1411 |
| Gold | #C9A26B | Décor et texte doré (7.88:1) |
| Warning | #E0B060 | (9.37:1) |
| Error | #FF8A80 | (8.18:1) |

### Couleurs des enveloppes (graphiques)

Ordre fixe, une couleur par enveloppe dans l'ordre de la méthode : #1F4D3A forest, #C9A26B gold, #8FB39A sage, #B5532E terracotta, #4A6D8C slate, #7A5C7E plum. Toujours doubler la couleur d'un libellé (jamais la couleur seule).

### Accessibility

- Texte #141414 sur crème : 16.34:1 (AAA)
- Forest sur crème : 8.54:1 (AAA) ; blanc sur Forest : 9.63:1 (AAA)
- Soon Gold sur crème : 2.10:1, donc **décoratif uniquement** ; utiliser Gold Ink pour du texte
- Tous les éléments interactifs respectent WCAG 2.1 AA

---

## 2. Typography

### Font Stack

```css
--font-heading: 'Syne', ui-sans-serif, system-ui, sans-serif;
--font-body: 'Instrument Sans', ui-sans-serif, system-ui, sans-serif;
--font-mono: 'IBM Plex Mono', ui-monospace, monospace;
```

- **Syne** : titres et grands montants mis en avant.
- **Instrument Sans** : texte, formulaires, tableaux. Les montants utilisent `font-variant-numeric: tabular-nums` pour que les chiffres s'alignent.
- **IBM Plex Mono** : petites étiquettes (pourcentages, codes devise, surtitres).

### Type Scale

| Element | Size (Desktop) | Size (Mobile) | Weight | Line Height |
|---------|----------------|---------------|--------|-------------|
| H1 | 56px | 36px | 700 | 1.1 |
| H2 | 36px | 28px | 600 | 1.2 |
| H3 | 24px | 20px | 600 | 1.3 |
| Montant clé | 40px | 32px | 600 | 1.1 |
| Body | 17px | 16px | 400 | 1.6 |
| Small | 14px | 14px | 400 | 1.5 |
| Label mono | 12px | 12px | 500 | 1.4 |

---

## 3. Logo Usage

### Concept
Une ligne d'horizon (partagée avec Soon Horizons). Au-dessus, trois barres croissantes en Forest. Au-dessus de la plus haute barre, un soleil plein en Soon Gold qui monte. Mot-symbole « soon finance » en minuscules, Syne.

### Variants

| Variant | File | Use Case |
|---------|------|----------|
| Full Horizontal | logo-full-horizontal.svg | En-tête, documents |
| Stacked | logo-stacked.svg | Espaces carrés, réseaux sociaux |
| Icon Only | logo-icon.svg | Favicon, application |
| Monochrome | logo-mono.svg | Impression une couleur |

### Clear Space
Minimum = hauteur du soleil du logo.

### Minimum Size

| Context | Minimum Width |
|---------|---------------|
| Digital - Full Logo | 120px |
| Digital - Icon | 24px |

### Don'ts
- Ne pas faire pivoter ni déformer le logo
- Ne pas changer ses couleurs hors palette
- Ne pas ajouter d'ombre ou d'effet
- Ne pas le poser sur un fond chargé sans contraste suffisant

---

## 4. Voice & Tone

**Vouvoiement partout** (« Votre revenu », « Vous avez tenu votre budget »).

### Brand Personality

| Trait | Description |
|-------|-------------|
| **Rassurant** | On ne juge jamais une situation financière |
| **Pédagogue** | Chaque chiffre est expliqué en une phrase simple |
| **Encourageant** | On célèbre les petits pas, pas seulement les gros montants |
| **Honnête** | On dit les limites : risques, pas de rendement garanti, pas de conseil personnalisé |

### Voice Chart

| Trait | We Are | We Are Not |
|-------|--------|------------|
| Rassurant | Calme, bienveillant | Alarmiste, culpabilisant |
| Pédagogue | Clair, concret, exemples chiffrés | Jargonneux, condescendant |
| Encourageant | Chaleureux, positif | Infantilisant, excessif |
| Honnête | Transparent sur les risques | Vendeur, « devenez riche vite » |

### Tone by Context

| Context | Tone | Example |
|---------|------|---------|
| Marketing | Engageant, concret | « Votre salaire, réparti en quelques secondes. » |
| Suggestions | Bienveillant, actionnable | « Commencez par mettre 10 % de côté : c'est l'habitude qui compte. » |
| Error messages | Calme, avec la solution | « Ce lien a expiré. Recevez-en un nouveau en un clic. » |
| Success | Bref, chaleureux | « Mois tenu ! Un pas de plus. » |
| Avertissements | Sobre, factuel | « Ceci est un contenu éducatif, pas un conseil financier personnalisé. » |

### Prohibited Terms

| Avoid | Reason |
|-------|--------|
| Devenez riche, rendement garanti | Promesse fausse et risque réglementaire |
| Meilleur placement, investissez dans X | Conseil personnalisé, hors périmètre |
| Révolutionnaire | Galvaudé |
| Vous devez, il faut absolument | Culpabilisant |
| Gratuit* (avec astérisque) | Le site est entièrement gratuit, sans condition |

---

## 5. Imagery Guidelines

### Photography Style
- Personnes réelles et diverses, majoritairement d'Afrique et de la diaspora, dans des scènes du quotidien (marché, bureau, famille)
- Lumière naturelle, chaude, de début de journée
- Jamais de liasses de billets, de lingots ni de signes de richesse ostentatoire

### Illustrations
- Formes simples : horizons, barres, soleils, cercles
- Palette de marque uniquement
- Trait 2px, coins arrondis 4px

### Icons
- Style contour, grille 24px
- Trait 1.5px
- Pas de remplissage

---

## 6. Design Components

### Buttons

| Type | Background | Text | Border Radius |
|------|------------|------|---------------|
| Primary | #1F4D3A | #FFFFFF | 10px |
| Secondary | Transparent, bordure #1F4D3A | #1F4D3A | 10px |
| Tertiary | Transparent | #6B665E | 10px |

### Cards
- Fond #FFFFFF sur crème, bordure 1px #DDD7CC, rayon 14px, pas d'ombre lourde
- Carte sélectionnée : fond #E3ECE6, bordure #1F4D3A

### Montants
- Toujours accompagnés de la devise de l'utilisateur, formatés selon sa langue (`500 000 FCFA`, `€1,500`)
- Chiffres tabulaires
