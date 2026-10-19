import { methodEntries } from "./methods";
import type { LearnEntry } from "./types";

export const articleEntries: LearnEntry[] = [
  {
    slug: "epargner-ou-investir", kind: "basics", minutes: 5,
    title: { fr: "Épargner ou investir : quelle différence ?", en: "Saving or investing: what is the difference?" },
    summary: {
      fr: "L’épargne garde votre argent disponible. Investir le fait travailler, avec des risques.",
      en: "Saving keeps your money available. Investing puts it to work, with risks.",
    },
    sections: [
      {
        heading: { fr: "Épargner : garder l’argent disponible", en: "Saving: keeping money available" },
        paragraphs: {
          fr: [
            "Épargner, c’est mettre de l’argent de côté pour le retrouver tel quel quand vous en avez besoin. Vous savez combien vous avez déposé, et vous pouvez le reprendre vite.",
            "C’est la bonne place pour les imprévus et pour les projets proches : une réparation, une rentrée scolaire, un voyage dans l’année.",
          ],
          en: [
            "Saving means setting money aside so you find it as it was when you need it. You know how much you put in, and you can take it back quickly.",
            "It is the right place for the unexpected and for near projects: a repair, school fees, a trip within the year.",
          ],
        },
      },
      {
        heading: { fr: "Investir : faire travailler l’argent", en: "Investing: putting money to work" },
        paragraphs: {
          fr: [
            "Investir, c’est placer de l’argent dans l’espoir qu’il prenne de la valeur avec le temps. L’espoir n’est pas une promesse : la valeur peut aussi baisser, et vous pouvez perdre une partie de ce que vous avez placé.",
            "Investir implique donc des risques de perte, des frais, et parfois une durée de placement longue pendant laquelle l’argent n’est pas libre.",
          ],
          en: [
            "Investing means placing money in the hope that it grows in value over time. Hope is not a promise: the value can also fall, and you can lose part of what you placed.",
            "So investing involves a risk of loss, fees, and sometimes a long holding period during which the money is not free.",
          ],
        },
      },
      {
        heading: { fr: "Aucun rendement n’est garanti", en: "No return is guaranteed" },
        paragraphs: {
          fr: [
            "Les rendements varient d’une année à l’autre. Les performances passées ne garantissent pas les résultats futurs. Méfiez-vous de toute offre qui promet un gain sûr ou rapide.",
          ],
          en: [
            "Returns vary from one year to the next. Past performance does not guarantee future results. Be wary of any offer that promises a sure or quick gain.",
          ],
        },
      },
      {
        heading: { fr: "Dans quel ordre ?", en: "In which order?" },
        paragraphs: {
          fr: [
            "Pour beaucoup de foyers, l’ordre est le suivant : couvrir les dépenses essentielles, rembourser les dettes coûteuses, construire une réserve d’urgence, puis seulement investir ce que vous pouvez laisser de côté longtemps.",
            "Ce n’est pas une règle absolue. Votre situation, la stabilité de vos revenus et vos responsabilités changent la réponse.",
          ],
          en: [
            "For many households the order is: cover essential spending, repay costly debts, build an emergency fund, and only then invest what you can leave aside for a long time.",
            "This is not an absolute rule. Your situation, how steady your income is and your responsibilities change the answer.",
          ],
        },
      },
    ],
  },
  {
    slug: "reserve-urgence", kind: "basics", minutes: 4,
    title: { fr: "La réserve d’urgence", en: "The emergency fund" },
    summary: {
      fr: "Combien, où la garder, comment la construire.",
      en: "How much, where to keep it, how to build it.",
    },
    sections: [
      {
        heading: { fr: "À quoi elle sert", en: "What it is for" },
        paragraphs: {
          fr: [
            "La réserve d’urgence couvre les coups durs : une perte de revenu, une urgence médicale, une panne. Grâce à elle, vous évitez de vous endetter ou de vendre un placement au mauvais moment.",
          ],
          en: [
            "The emergency fund covers hard blows: a loss of income, a medical emergency, a breakdown. Thanks to it, you avoid going into debt or selling an investment at the wrong time.",
          ],
        },
      },
      {
        heading: { fr: "Combien mettre de côté", en: "How much to set aside" },
        paragraphs: {
          fr: [
            "Un repère courant est de 3 à 6 mois de dépenses essentielles. Si votre loyer, votre nourriture, votre transport et vos factures coûtent 300 000 par mois, la réserve visée va de 900 000 à 1 800 000.",
            "Le bon niveau dépend de vos dépenses, de la stabilité de vos revenus et de vos responsabilités. Un revenu irrégulier ou une famille à charge justifient de viser plus haut.",
          ],
          en: [
            "A common guideline is 3 to 6 months of essential spending. If your rent, food, transport and bills cost 300,000 a month, the target runs from 900,000 to 1,800,000.",
            "The right level depends on your spending, how steady your income is and your responsibilities. Irregular income or dependants are reasons to aim higher.",
          ],
        },
      },
      {
        heading: { fr: "Où la garder", en: "Where to keep it" },
        paragraphs: {
          fr: [
            "Gardez-la accessible et peu risquée : vous devez pouvoir la reprendre en quelques jours, sans perdre de valeur. Une réserve placée là où elle peut baisser ou être bloquée ne remplit plus son rôle.",
          ],
          en: [
            "Keep it accessible and low-risk: you must be able to take it back within days, without losing value. A fund placed where it can fall or be locked no longer does its job.",
          ],
        },
      },
      {
        heading: { fr: "Comment la construire", en: "How to build it" },
        paragraphs: {
          fr: [
            "Commencez petit. Dix pour cent de votre revenu mis de côté chaque mois vaut mieux qu’un grand projet jamais commencé. Automatisez le virement le jour de la paie, et fixez-vous un premier palier : un mois de dépenses essentielles.",
            "Chaque palier atteint mérite d’être fêté. C’est l’habitude qui compte.",
          ],
          en: [
            "Start small. Ten percent of your income set aside each month beats a big plan never started. Automate the transfer on payday, and set a first milestone: one month of essential spending.",
            "Every milestone reached deserves a celebration. The habit is what counts.",
          ],
        },
      },
    ],
  },
  {
    slug: "dettes-dabord", kind: "basics", minutes: 4,
    title: { fr: "Rembourser ses dettes d’abord", en: "Repay debts first" },
    summary: {
      fr: "Pourquoi une dette coûteuse passe avant l’épargne.",
      en: "Why a costly debt comes before saving.",
    },
    sections: [
      {
        heading: { fr: "Une dette a un prix", en: "A debt has a price" },
        paragraphs: {
          fr: [
            "Une dette vous coûte des intérêts, mois après mois. Si le taux d’une dette est élevé, ce coût dépasse souvent ce que votre épargne pourrait vous apporter, et personne ne vous garantit un gain.",
            "Rembourser une dette coûteuse revient donc à obtenir un résultat sûr : vous cessez de payer ces intérêts.",
          ],
          en: [
            "A debt costs you interest, month after month. When the rate is high, that cost often exceeds what your savings could bring you, and no gain is guaranteed.",
            "Repaying a costly debt therefore gives a sure result: you stop paying that interest.",
          ],
        },
      },
      {
        heading: { fr: "Toutes les dettes ne se valent pas", en: "Not all debts are equal" },
        paragraphs: {
          fr: [
            "Commencez par repérer le taux, les frais et la durée de chaque dette. Les crédits à la consommation et les avances à taux élevé pèsent plus lourd qu’un prêt à taux modéré.",
            "Une dette à faible coût peut parfois attendre pendant que vous constituez une première réserve.",
          ],
          en: [
            "Start by noting the rate, fees and term of each debt. Consumer credit and high-rate advances weigh more than a moderate-rate loan.",
            "A low-cost debt can sometimes wait while you build a first reserve.",
          ],
        },
      },
      {
        heading: { fr: "Un ordre simple", en: "A simple order" },
        paragraphs: {
          fr: [
            "Mettez de côté un petit coussin de sécurité pour ne pas retomber dans la dette au prochain imprévu. Payez les minimums partout. Puis dirigez tout ce que vous pouvez vers la dette la plus chère.",
            "Quand elle est soldée, reprenez la même somme pour la suivante, puis pour votre épargne.",
          ],
          en: [
            "Set aside a small safety cushion so the next surprise does not push you back into debt. Pay the minimums everywhere. Then send everything you can to the most expensive debt.",
            "When it is cleared, move the same amount to the next one, then to your savings.",
          ],
        },
      },
      {
        heading: { fr: "Sans vous juger", en: "Without judgement" },
        paragraphs: {
          fr: [
            "Avoir des dettes est courant, et cela ne dit rien de votre valeur. Le simulateur le prend en compte : si vous indiquez des dettes, il vous suggère de les traiter avant d’investir.",
          ],
          en: [
            "Having debts is common, and it says nothing about your worth. The simulator takes it into account: if you report debts, it suggests dealing with them before investing.",
          ],
        },
      },
    ],
  },
  {
    slug: "risques-frais-duree", kind: "basics", minutes: 6,
    title: { fr: "Risques, frais et durée", en: "Risks, fees and time" },
    summary: {
      fr: "Les trois questions à poser avant tout placement.",
      en: "The three questions to ask before any investment.",
    },
    sections: [
      {
        heading: { fr: "Le risque : puis-je perdre de l’argent ?", en: "Risk: can I lose money?" },
        paragraphs: {
          fr: [
            "Tout placement comporte un risque : la valeur peut baisser, l’émetteur peut ne pas rembourser, l’organisme peut disparaître. En général, plus l’espoir de gain est grand, plus le risque de perte l’est aussi.",
            "Demandez-vous : si je perdais la moitié de cette somme, que se passerait-il dans ma vie ? Si la réponse vous inquiète, cet argent n’a pas sa place dans un placement risqué.",
          ],
          en: [
            "Every investment carries a risk: the value can fall, the issuer may not repay, the organisation may disappear. In general, the bigger the hope of gain, the bigger the risk of loss.",
            "Ask yourself: if I lost half of this amount, what would happen in my life? If the answer worries you, this money does not belong in a risky investment.",
          ],
        },
      },
      {
        heading: { fr: "Les frais : combien cela me coûte-t-il ?", en: "Fees: what does it cost me?" },
        paragraphs: {
          fr: [
            "Les frais d’entrée, de gestion, de retrait ou de tenue de compte réduisent ce que vous gardez, qu’il y ait un gain ou non. Un petit pourcentage chaque année pèse beaucoup sur dix ou vingt ans.",
            "Demandez la liste complète des frais par écrit, et comparez-la avant de signer.",
          ],
          en: [
            "Entry, management, withdrawal or account fees reduce what you keep, whether or not there is a gain. A small percentage each year weighs a lot over ten or twenty years.",
            "Ask for the full list of fees in writing, and compare it before you sign.",
          ],
        },
      },
      {
        heading: { fr: "La durée : quand puis-je reprendre mon argent ?", en: "Time: when can I get my money back?" },
        paragraphs: {
          fr: [
            "Certains placements bloquent l’argent pendant des années, d’autres le rendent vite mais à un prix qui peut être perdant. Plus votre projet est proche, moins vous pouvez accepter de risque.",
            "Une règle de bon sens : n’investissez pas l’argent dont vous aurez besoin dans les prochaines années.",
          ],
          en: [
            "Some investments lock money for years, others release it quickly but at a price that may be a loss. The closer your project, the less risk you can accept.",
            "A common-sense rule: do not invest money you will need within the next few years.",
          ],
        },
      },
      {
        heading: { fr: "Vérifier avant de décider", en: "Check before you decide" },
        paragraphs: {
          fr: [
            "Aucun rendement n’est garanti. Vérifiez la réglementation, la fiscalité, la sécurité et la disponibilité des produits dans votre pays, et l’existence d’un organisme de contrôle. Méfiez-vous des promesses de gains rapides, de la pression pour décider vite et des offres que vous ne comprenez pas.",
            "Si vous ne pouvez pas expliquer le placement en deux phrases, attendez.",
          ],
          en: [
            "No return is guaranteed. Check the regulation, taxes, security and availability of products in your country, and whether a supervisory body exists. Be wary of promises of quick gains, pressure to decide fast and offers you do not understand.",
            "If you cannot explain the investment in two sentences, wait.",
          ],
        },
      },
    ],
  },
  {
    slug: "types-de-placements", kind: "basics", minutes: 7,
    title: { fr: "Les grands types de placements", en: "The main types of investments" },
    summary: {
      fr: "Compte d’épargne, tontine, obligations, actions, immobilier : les familles, leurs risques et leur horizon.",
      en: "Savings account, tontine, bonds, shares, property: the families, their risks and time horizon.",
    },
    sections: [
      {
        heading: { fr: "Lire cette page", en: "How to read this page" },
        paragraphs: {
          fr: [
            "Voici cinq grandes familles, décrites en termes généraux. Ce ne sont pas des recommandations et aucun produit n’est cité. Les frais, la fiscalité et les règles changent d’un pays à l’autre : vérifiez-les avant d’agir.",
          ],
          en: [
            "Here are five broad families, described in general terms. They are not recommendations and no product is named. Fees, taxes and rules change from one country to another: check them before acting.",
          ],
        },
      },
      {
        heading: { fr: "Épargne bancaire", en: "Bank savings" },
        paragraphs: {
          fr: [
            "Risque : faible, selon la solidité de l’établissement et la protection des dépôts dans votre pays. Frais : tenue de compte, parfois des frais de retrait. Horizon : court à moyen terme. Le gain est modeste et peut être inférieur à la hausse des prix.",
          ],
          en: [
            "Risk: low, depending on the strength of the institution and deposit protection in your country. Fees: account fees, sometimes withdrawal fees. Horizon: short to medium term. The gain is modest and can be below the rise in prices.",
          ],
        },
      },
      {
        heading: { fr: "Tontine", en: "Tontine" },
        paragraphs: {
          fr: [
            "Un groupe cotise régulièrement et chacun reçoit la somme à tour de rôle. Risque : la confiance dans le groupe ; si un membre ne paie plus, les autres en subissent les conséquences. Frais : souvent nuls, mais les règles doivent être claires. Horizon : la durée du cycle. C’est une discipline d’épargne plus qu’un placement.",
          ],
          en: [
            "A group contributes regularly and each member receives the pot in turn. Risk: trust in the group; if a member stops paying, the others bear the consequences. Fees: often none, but the rules must be clear. Horizon: the length of the cycle. It is a saving discipline more than an investment.",
          ],
        },
      },
      {
        heading: { fr: "Obligations", en: "Bonds" },
        paragraphs: {
          fr: [
            "Vous prêtez de l’argent à un État ou à une entreprise, qui verse des intérêts puis rembourse à l’échéance. Risque : moyen ; l’emprunteur peut ne pas rembourser, et le prix peut baisser si vous revendez avant l’échéance. Frais : de courtage et de gestion. Horizon : moyen à long terme.",
          ],
          en: [
            "You lend money to a state or a company, which pays interest then repays at maturity. Risk: medium; the borrower may fail to repay, and the price can fall if you sell before maturity. Fees: brokerage and management. Horizon: medium to long term.",
          ],
        },
      },
      {
        heading: { fr: "Actions", en: "Shares" },
        paragraphs: {
          fr: [
            "Vous achetez une petite part d’une entreprise. Risque : élevé ; la valeur monte et descend, parfois fortement, et vous pouvez tout perdre. Frais : de courtage, de gestion et de change. Horizon : long terme, de nombreuses années, avec de l’argent dont vous n’avez pas besoin.",
          ],
          en: [
            "You buy a small part of a company. Risk: high; the value rises and falls, sometimes sharply, and you can lose everything. Fees: brokerage, management and currency. Horizon: long term, many years, with money you do not need.",
          ],
        },
      },
      {
        heading: { fr: "Immobilier", en: "Property" },
        paragraphs: {
          fr: [
            "Acheter un terrain ou un logement, pour y vivre ou le louer. Risque : élevé et concentré ; litiges de titre, loyers impayés, baisse de valeur, difficulté à revendre. Frais : achat, notaire ou enregistrement, entretien, impôts. Horizon : long terme, et l’argent est peu disponible.",
          ],
          en: [
            "Buying land or a home, to live in or to rent out. Risk: high and concentrated; title disputes, unpaid rent, falling value, difficulty reselling. Fees: purchase, legal and registration costs, upkeep, taxes. Horizon: long term, and the money is hard to access.",
          ],
        },
      },
      {
        heading: { fr: "Pour choisir", en: "To choose" },
        paragraphs: {
          fr: [
            "Aucune famille n’est la meilleure pour tous. Commencez par votre réserve d’urgence, comprenez les risques, les frais et la durée, et répartissez plutôt que de tout mettre au même endroit.",
          ],
          en: [
            "No family is the best for everyone. Start with your emergency fund, understand the risks, fees and time, and spread your money rather than putting it all in one place.",
          ],
        },
      },
    ],
  },
];

export const learnEntries: LearnEntry[] = [...articleEntries, ...methodEntries];
