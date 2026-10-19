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
          fr: "Site : Vercel Inc. · API : Render · Base de données : Neon, région UE (Francfort)",
          en: "Website: Vercel Inc. · API: Render · Database: Neon, EU region (Frankfurt)",
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
          "Des événements anonymes (simulation faite, comparaison vue, inscription commencée) pour savoir si Soon Finance aide vraiment. Chaque événement contient seulement son type, la langue, la devise, un identifiant aléatoire et la date. Il n’est pas relié à votre compte.",
          "Vos mois clôturés (taux d’épargne, montants épargnés, note d’utilité) entrent aussi, sans votre nom ni votre email, dans des totaux internes calculés sur au moins 5 personnes : c’est la mesure de l’impact de Soon.",
          "Pour limiter les abus, l’adresse IP de chaque demande de connexion est conservée sous forme brouillée (hachée), jamais en clair.",
        ],
        en: [
          "Your email, so you can sign in. Your first name if you give it.",
          "Your budgets, actual amounts, goals and reviews, to show them back to you.",
          "Anonymous events (simulation done, comparison viewed, sign-up started) to learn whether Soon Finance really helps. Each event holds only its type, the language, the currency, a random identifier and the date. It is not linked to your account.",
          "Your closed months (savings rate, saved amounts, helpfulness rating) are also used, without your name or email, in internal totals computed over at least 5 people: this is how Soon measures its impact.",
          "To limit abuse, the IP address of each sign-in request is kept in scrambled (hashed) form, never in clear.",
        ],
      },
      callout: {
        fr: "Nous ne vendons ni ne louons aucune donnée. Seuls nos prestataires techniques cités ici les traitent, pour notre compte. Pas de publicité, pas de pistage publicitaire.",
        en: "We do not sell or rent any data. Only the technical providers named here process it, on our behalf. No ads, no advertising tracking.",
      },
    },
    {
      id: "ou",
      heading: { fr: "Où sont vos données", en: "Where your data lives" },
      paragraphs: {
        fr: [
          "Dans une base de données hébergée dans l’Union européenne (Francfort). Votre lien de connexion vous est envoyé par email via Resend, notre service d’envoi.",
          "Deux cookies sont utilisés. Le cookie de session vous garde connecté 30 jours ; il n’est pas lisible par les scripts de la page. Le cookie de langue (sf-lang) retient votre langue pendant 1 an.",
          "Le stockage local de votre navigateur, sur votre appareil seulement, retient aussi votre thème (sf-theme), votre simulation en cours (sf-simulation), un marqueur de session, conservé jusqu’à la fermeture de l’onglet, pour n’envoyer qu’une seule fois l’événement « simulation faite » (sf-sim-sent), et un identifiant anonyme (sf-anon).",
          "Cet identifiant est aléatoire. Il reste sur cet appareil et relie entre eux les événements d’usage anonymes venant du même navigateur, jamais à votre email, votre prénom ou vos montants. Vous pouvez l’effacer en vidant les données du site dans votre navigateur.",
        ],
        en: [
          "In a database hosted in the European Union (Frankfurt). Your sign-in link is emailed to you through Resend, our sending service.",
          "Two cookies are used. The session cookie keeps you signed in for 30 days; page scripts cannot read it. The language cookie (sf-lang) remembers your language for 1 year.",
          "Your browser's local storage, on your device only, also remembers your theme (sf-theme), your simulation in progress (sf-simulation), a session marker, kept until the tab is closed, so that the “simulation done” event is sent only once (sf-sim-sent), and an anonymous identifier (sf-anon).",
          "This identifier is random. It stays on this device and links together anonymous usage events from the same browser, never to your email, first name or amounts. You can erase it by clearing the site data in your browser.",
        ],
      },
    },
    {
      id: "droits",
      heading: { fr: "Vos droits", en: "Your rights" },
      settingsLink: {
        fr: ["Depuis ", "Paramètres", ", vous pouvez à tout moment télécharger toutes vos données ou supprimer votre compte. La suppression efface définitivement votre compte et toutes les données qui y sont liées ; les événements anonymes, qui ne sont pas reliés à votre compte, subsistent."],
        en: ["From ", "Settings", ", you can at any time download all your data or delete your account. Deletion permanently erases your account and all data linked to it; anonymous events, which are not linked to your account, remain."],
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
