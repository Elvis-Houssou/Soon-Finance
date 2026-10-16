---
target: 30 maquettes Soon Finance
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:C:\\Users\\HP\\Desktop\\Elvis\\CHRIST\\Projet\\Bientôt\\Finance\\Web App\\docs\\maquettes"
timestamp: 2026-10-16T20-07-56Z
slug: docs-maquettes
---
Method: dual-agent (A: design review · B: detector)

## Design Health Score — 24/40 (Acceptable)
| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Live recalculation good; no saving/loading states |
| 2 | Match real world | 3 | "tenu" undefined; methods named by ratios; dashboard labelled "Accueil" |
| 3 | User control | 2 | Comparer chips not removable; closed month not editable; logged-in "Budget" goes to public simulator |
| 4 | Consistency | 2 | Envelope colours vary by screen; nav labels drift; FR/EN inert on desktop |
| 5 | Error prevention | 2 | Cloture doesn't check totals; currency change relabels amounts silently |
| 6 | Recognition | 3 | Comparer bars without legend |
| 7 | Flexibility | 2 | No "same as planned" prefill |
| 8 | Minimalist | 3 | Double signup CTA in Simulateur; duplicated disclaimer |
| 9 | Error recovery | 1 | Only LienExpire designed; spec §9 errors missing |
| 10 | Help | 3 | Simulateur doesn't link to the method fiche |

## Design specificity
Copy is product-specific; visuals are a repeated generic template (eyebrow + Syne H1 + bordered card + mint button + disclaimer). Brand motifs (horizon, rising sun, "un pas de plus") absent from UI.
Detector: 55 findings — overused-font x30 (Instrument Sans, intentional shared Soon font, not a defect); low-contrast x20 (#07863F on #E6FCEF / #F3F5F4 = 4.3:1, real, light theme); hero-eyebrow-chip x3 + kicker-above-heading x2 (agrees with template sameness). Browser overlay unavailable.

## Priority issues
1. [P1] Data contradicts claims ("tenu 3 mois" vs overspend/undersave history; 157 000/mois goal > planned savings; "il faut"; Oct closed vs to close) — /impeccable clarify
2. [P1] Data colours: mint bars on white 1.5:1; brand-ink on tint 4.3:1; unstable envelope colours; no legends — /impeccable colorize
3. [P1] No first-run/empty/error states; consent CTA is a link; no custom-method editor — /impeccable onboard + /impeccable harden
4. [P2] Monthly loop has no peak; overspend in error red — /impeccable delight
5. [P2] IA/nav drift (hidden Historique/Paramètres on mobile, Budget→public simulator, inert FR/EN) — /impeccable layout

## Persona red flags
Jordan: ratio-only method names, FIRE jargon, no starting recommendation. Casey: 1180px simulator with CTA at bottom, inert currency/lang buttons, 36px chips. Sam: colour-only legends, <a> as submit, ungrouped rating, 11px text.

## Minor
Long amounts/EN overflow; 20 % vs 18,6 %; Impact order differs; ▾ glyph; 2 of 3 optional questions missing; hero example differs mobile/desktop.

## Questions
What does "tenir son budget" mean? Why no horizon on any screen? Should beginners see six methods at once?
