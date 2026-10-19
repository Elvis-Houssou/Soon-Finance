import type { LearnEntry, Localized } from "./types";

const HOW: Localized = { fr: "Comment ça marche", en: "How it works" };
const WHO: Localized = { fr: "Pour qui", en: "Who it suits" };
const LIMIT: Localized = { fr: "Limite", en: "Limit" };

type Sheet = {
  slug: string; title: Localized; summary: Localized;
  how: Localized<string[]>; who: Localized<string[]>; limit: Localized<string[]>;
};

const sheet = (s: Sheet): LearnEntry => ({
  slug: s.slug, kind: "method", title: s.title, summary: s.summary,
  sections: [
    { heading: HOW, paragraphs: s.how },
    { heading: WHO, paragraphs: s.who },
    { heading: LIMIT, paragraphs: s.limit },
  ],
  example: { methodId: s.slug },
});

export const methodEntries: LearnEntry[] = [
  sheet({
    slug: "50-30-20",
    title: { fr: "50/30/20", en: "50/30/20" },
    summary: {
      fr: "Une moitié pour vos besoins, un peu moins d’un tiers pour vos envies, le reste pour épargner.",
      en: "Half for your needs, just under a third for your wants, the rest for saving.",
    },
    how: {
      fr: [
        "Besoins (50 %) : ce que vous ne pouvez pas éviter. Loyer, nourriture, transport, factures, frais de scolarité.",
        "Envies (30 %) : ce qui rend la vie agréable mais reste un choix. Sorties, vêtements, abonnements, cadeaux.",
        "Épargne (20 %) : votre réserve d’urgence d’abord, puis vos projets et, plus tard, vos placements.",
      ],
      en: [
        "Needs (50%): what you cannot avoid. Rent, food, transport, bills, school fees.",
        "Wants (30%): what makes life pleasant but remains a choice. Outings, clothes, subscriptions, gifts.",
        "Savings (20%): your emergency fund first, then your projects and, later, investments.",
      ],
    },
    who: {
      fr: ["Ceux qui débutent et veulent une règle simple à retenir."],
      en: ["People who are just starting and want a simple rule to remember."],
    },
    limit: {
      fr: ["Si vos besoins dépassent 50 %, ajustez avec une répartition personnalisée. Les pourcentages sont des repères, pas des obligations."],
      en: ["If your needs go above 50%, adjust with a custom split. Percentages are guidelines, not obligations."],
    },
  }),
  sheet({
    slug: "70-20-10",
    title: { fr: "70/20/10", en: "70/20/10" },
    summary: {
      fr: "Dépenses courantes, épargne, et une part pour les dons ou la dîme.",
      en: "Everyday spending, saving, and a share for giving or tithing.",
    },
    how: {
      fr: [
        "Dépenses (70 %) : tout ce qui sert à vivre au quotidien, besoins comme envies.",
        "Épargne (20 %) : de l’argent mis de côté pour les imprévus et les projets.",
        "Dons (10 %) : une part pour les dons, la dîme ou une autre priorité qui compte pour vous. C’est un choix personnel, et vous pouvez l’adapter.",
      ],
      en: [
        "Spending (70%): everything you use to live day to day, needs and wants alike.",
        "Savings (20%): money set aside for the unexpected and for projects.",
        "Giving (10%): a share for gifts, tithing or another priority that matters to you. It is a personal choice, and you can adapt it.",
      ],
    },
    who: {
      fr: ["Ceux pour qui donner fait partie du budget, et qui veulent une règle à trois parts."],
      en: ["People for whom giving is part of the budget, and who want a three-part rule."],
    },
    limit: {
      fr: ["Une seule enveloppe de dépenses ne dit pas où va l’argent. Si vous voulez distinguer besoins et envies, regardez le 50/30/20."],
      en: ["A single spending envelope does not show where the money goes. If you want to tell needs from wants, look at 50/30/20."],
    },
  }),
  sheet({
    slug: "80-20",
    title: { fr: "80/20", en: "80/20" },
    summary: {
      fr: "Mettez 20 % de côté, vivez avec le reste. La plus simple.",
      en: "Set 20% aside, live on the rest. The simplest one.",
    },
    how: {
      fr: [
        "Dès que votre revenu arrive, 20 % part en épargne.",
        "Les 80 % restants servent à vivre. Vous les organisez comme vous voulez.",
      ],
      en: [
        "As soon as your income arrives, 20% goes to savings.",
        "The remaining 80% is for living. You organise it as you wish.",
      ],
    },
    who: {
      fr: ["Ceux qui veulent démarrer sans se compliquer la vie, ou reprendre une habitude d’épargne."],
      en: ["People who want to start without complications, or to rebuild a saving habit."],
    },
    limit: {
      fr: ["Si 80 % ne couvrent pas vos dépenses essentielles, commencez plus bas, par exemple 10 %. L’habitude compte plus que le montant."],
      en: ["If 80% does not cover your essential spending, start lower, for example 10%. The habit matters more than the amount."],
    },
  }),
  sheet({
    slug: "six-jars",
    title: { fr: "Les 6 comptes", en: "The 6 accounts" },
    summary: {
      fr: "Six enveloppes, chacune avec un rôle précis.",
      en: "Six envelopes, each with a clear role.",
    },
    how: {
      fr: [
        "Nécessités (55 %) : le logement, la nourriture, le transport, les factures.",
        "Investir (10 %), épargne long terme (10 %) et éducation (10 %) : trois enveloppes pour préparer l’avenir et apprendre.",
        "Loisirs (10 %) et dons (5 %) : du plaisir et de la générosité, sans culpabilité.",
      ],
      en: [
        "Necessities (55%): housing, food, transport, bills.",
        "Invest (10%), long-term savings (10%) and education (10%): three envelopes to prepare the future and to learn.",
        "Fun (10%) and giving (5%): enjoyment and generosity, without guilt.",
      ],
    },
    who: {
      fr: ["Ceux qui aiment que chaque franc ait un rôle et qui sont prêts à suivre plusieurs enveloppes."],
      en: ["People who like every coin to have a role and are ready to follow several envelopes."],
    },
    limit: {
      fr: ["Les catégories et les pourcentages varient selon la version utilisée. Celle-ci est un exemple à adapter à votre situation."],
      en: ["Categories and percentages vary between versions. This one is an example to adapt to your situation."],
    },
  }),
  sheet({
    slug: "soon-10-70-20",
    title: { fr: "Modèle Soon 10/70/20", en: "Soon 10/70/20 model" },
    summary: {
      fr: "Une épargne très élevée, pour avancer vite vers l’indépendance financière. Exigeant.",
      en: "A very high savings share, to move fast towards financial independence. Demanding.",
    },
    how: {
      fr: [
        "Dons (10 %) : la dîme ou une contribution, si elle correspond à vos valeurs.",
        "Épargne et investissement (70 %) : réserve d’urgence (20 %), projets long terme et retraite (20 %), formation financière (10 %) et investissements (50 %). Les investissements se choisissent après avoir compris les risques, les frais et les conditions.",
        "Dépenses personnelles (20 %) : loisirs (30 %), livres et développement personnel (25 %), cadeaux (20 %), bien-être (15 %) et réserve flexible (10 %).",
      ],
      en: [
        "Giving (10%): tithing or a contribution, if it matches your values.",
        "Savings and investing (70%): emergency fund (20%), long-term projects and retirement (20%), financial education (10%) and investments (50%). Investments are chosen after understanding the risks, fees and conditions.",
        "Personal spending (20%): leisure (30%), books and personal growth (25%), gifts (20%), wellbeing (15%) and a flexible reserve (10%).",
      ],
    },
    who: {
      fr: ["Ceux dont les dépenses essentielles sont déjà couvertes autrement, ou très basses, et qui visent l’indépendance financière à long terme."],
      en: ["People whose essential spending is already covered another way, or very low, and who aim for long-term financial independence."],
    },
    limit: {
      fr: [
        "Ce modèle convient si vos dépenses essentielles sont déjà couvertes. Avec 20 % pour vivre, il est souvent trop serré.",
        "Aucun rendement n’est garanti. Si votre réserve d’urgence est faible ou si vous avez des dettes coûteuses, traitez-les d’abord avant d’augmenter les investissements.",
      ],
      en: [
        "This model suits you if your essential spending is already covered. With 20% to live on, it is often too tight.",
        "No return is guaranteed. If your emergency fund is low or you have costly debts, deal with those first before increasing investments.",
      ],
    },
  }),
  sheet({
    slug: "custom",
    title: { fr: "Répartition personnalisée", en: "Custom split" },
    summary: {
      fr: "Vos catégories, vos pourcentages. À votre façon.",
      en: "Your categories, your percentages. Your own way.",
    },
    how: {
      fr: [
        "Vous choisissez vos enveloppes et leur part. Le total doit faire 100 %.",
        "Partez de vos obligations réelles (loyer, famille, études), puis ajoutez vos objectifs et vos valeurs.",
      ],
      en: [
        "You choose your envelopes and their share. The total must be 100%.",
        "Start from your real obligations (rent, family, studies), then add your goals and values.",
      ],
    },
    who: {
      fr: ["Ceux dont la situation ne rentre dans aucune règle toute faite."],
      en: ["People whose situation fits no ready-made rule."],
    },
    limit: {
      fr: ["Sans repère, il est facile de sous-estimer l’épargne. Le simulateur vous signale quand le total n’atteint pas 100 %."],
      en: ["Without a reference point, it is easy to underestimate saving. The simulator tells you when the total is not 100%."],
    },
  }),
];
