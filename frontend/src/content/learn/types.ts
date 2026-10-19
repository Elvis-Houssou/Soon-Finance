export type Localized<T = string> = { fr: T; en: T };

export type LearnEntry = {
  slug: string;
  kind: "method" | "basics";
  minutes: number;
  title: Localized;
  summary: Localized;
  sections: { heading: Localized; paragraphs: Localized<string[]> }[];
  example?: { methodId: string };
};
