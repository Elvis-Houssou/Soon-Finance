import type { Localized } from "./learn/types";

export type LegalSection = {
  id: string;
  heading: Localized;
  paragraphs?: Localized<string[]>;
  bullets?: Localized<string[]>;
  /** Encadré mis en avant sous les puces. */
  callout?: Localized;
  /** Paragraphe contenant le lien vers Paramètres : texte avant / libellé du lien / texte après. */
  settingsLink?: Localized<[string, string, string]>;
};

// Les informations d'entreprise restent des marqueurs visibles, identiques en FR et EN, jusqu'à ce que le propriétaire les fournisse.
export const PLACEHOLDERS = {
  date: "[DATE]",
  company: "[RAISON SOCIALE]",
  address: "[ADRESSE]",
  registration: "[N° D'IMMATRICULATION]",
  manager: "[NOM DU RESPONSABLE]",
  email: "[EMAIL DE CONTACT]",
};

export const legal = {
  title: { fr: "Confidentialité", en: "Privacy" },
  lead: {
    fr: "Votre salaire est une information privée. Voici, simplement, ce que nous en faisons.",
    en: "Your salary is private. Here, in plain words, is what we do with it.",
  },
  toc: { fr: "Sommaire", en: "Contents" },
  updated: { fr: "Mis à jour le", en: "Updated on" },
  contact: { fr: "Une question :", en: "A question:" },
  mentions: {
    heading: { fr: "Mentions légales", en: "Legal notice" },
    items: [
      { label: { fr: "Éditeur", en: "Publisher" }, value: { fr: "Soon Finance, une marque Soon", en: "Soon Finance, a Soon brand" }, placeholders: ["company", "address", "registration"] },
      { label: { fr: "Responsable de publication", en: "Publication manager" }, value: { fr: "", en: "" }, placeholders: ["manager"] },
      { label: { fr: "Contact", en: "Contact" }, value: { fr: "", en: "" }, placeholders: ["email"] },
      {
        label: { fr: "Hébergement", en: "Hosting" },
        value: {
          fr: "Site : Vercel Inc. · API : hébergeur à confirmer · Base de données : Neon, région UE (Francfort)",
          en: "Website: Vercel Inc. · API: host to be confirmed · Database: Neon, EU region (Frankfurt)",
        },
        placeholders: [],
      },
    ],
  },
  sections: [
    {
      id: "collecte",
      heading: { fr: "Ce que nous gardons", en: "What we keep" },
      bullets: {
        fr: [
          "Votre email, pour vous connecter. Votre prénom si vous le donnez.",
          "Vos budgets, montants réels, objectifs et bilans, pour vous les afficher.",
          "Des statistiques anonymes (simulations faites, mois clôturés) pour savoir si Soon Finance aide vraiment. Chaque événement contient seulement son type, la langue, la devise et un identifiant aléatoire. Jamais vos montants ni votre email.",
          "Pour limiter les abus, l’adresse IP de chaque demande de connexion est conservée sous forme brouillée (hachée), jamais en clair.",
        ],
        en: [
          "Your email, so you can sign in. Your first name if you give it.",
          "Your budgets, actual amounts, goals and reviews, to show them back to you.",
          "Anonymous statistics (simulations run, months closed) to learn whether Soon Finance really helps. Each event holds only its type, the language, the currency and a random identifier. Never your amounts or your email.",
          "To limit abuse, the IP address of each sign-in request is kept in scrambled (hashed) form, never in clear.",
        ],
      },
      callout: {
        fr: "Nous ne vendons, ne louons et ne partageons aucune donnée. Pas de publicité, pas de pistage publicitaire.",
        en: "We do not sell, rent or share any data. No ads, no advertising tracking.",
      },
    },
    {
      id: "ou",
      heading: { fr: "Où sont vos données", en: "Where your data lives" },
      paragraphs: {
        fr: [
          "Dans une base de données hébergée dans l’Union européenne (Francfort). Votre lien de connexion vous est envoyé par email via Resend, notre service d’envoi.",
          "Un seul cookie est nécessaire : le cookie de session, qui vous garde connecté 30 jours. Votre navigateur retient aussi, sur votre appareil seulement, votre langue (cookie sf-lang), votre thème et votre simulation en cours (sf-theme, sf-simulation), ainsi qu’un identifiant anonyme (sf-anon). Un événement anonyme au plus est envoyé par visite.",
        ],
        en: [
          "In a database hosted in the European Union (Frankfurt). Your sign-in link is emailed to you through Resend, our sending service.",
          "One cookie is required: the session cookie, which keeps you signed in for 30 days. Your browser also remembers, on your device only, your language (sf-lang cookie), your theme and your simulation in progress (sf-theme, sf-simulation), plus an anonymous identifier (sf-anon). At most one anonymous event is sent per visit.",
        ],
      },
    },
    {
      id: "droits",
      heading: { fr: "Vos droits", en: "Your rights" },
      settingsLink: {
        fr: ["Depuis ", "Paramètres", ", vous pouvez à tout moment télécharger toutes vos données ou supprimer votre compte. La suppression efface tout, définitivement."],
        en: ["From ", "Settings", ", you can at any time download all your data or delete your account. Deletion erases everything, for good."],
      },
    },
    {
      id: "conseil",
      heading: { fr: "Pas un conseil financier", en: "Not financial advice" },
      paragraphs: {
        fr: ["Soon Finance propose un contenu éducatif et des repères généraux. Ce n’est pas un conseil financier personnalisé. Investir comporte des risques de perte ; aucun rendement n’est garanti."],
        en: ["Soon Finance offers educational content and general guidance. It is not personalised financial advice. Investing carries a risk of loss; no return is guaranteed."],
      },
    },
  ] satisfies LegalSection[],
};
