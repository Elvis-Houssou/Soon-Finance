export type Localized<T = string> = { fr: T; en: T };

export type LearnEntry = {
  slug: string;
  kind: "method" | "basics";
  title: Localized;
  summary: Localized;
  sections: { heading: Localized; paragraphs: Localized<string[]> }[];
  example?: { methodId: string };
};

/** Temps de lecture (~200 mots/min, au moins 1 min) calculé sur le texte de la langue demandée. */
export function readingMinutes(e: LearnEntry, lang: "fr" | "en"): number {
  const text = [e.title[lang], e.summary[lang], ...e.sections.flatMap((s) => [s.heading[lang], ...s.paragraphs[lang]])].join(" ");
  return Math.max(1, Math.round(text.split(/\s+/).filter(Boolean).length / 200));
}
