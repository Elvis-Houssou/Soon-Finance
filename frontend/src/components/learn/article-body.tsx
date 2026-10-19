import type { Locale } from "@/i18n/config";
import type { LearnEntry } from "@/content/learn/types";

/** Sections d’un article ; `after` s’insère sous la section d’indice donné (l’exemple chiffré d’une fiche). */
export function ArticleBody({
  entry, locale, after,
}: { entry: LearnEntry; locale: Locale; after?: { index: number; node: React.ReactNode } }) {
  return (
    <div className="flex flex-col gap-8">
      {entry.sections.map((s, i) => (
        <div key={i} className="flex flex-col gap-8">
          <section className="flex flex-col gap-3">
            <h2 className="font-display text-2xl font-semibold">{s.heading[locale]}</h2>
            {s.paragraphs[locale].map((p, j) => <p key={j} className="text-lg leading-relaxed">{p}</p>)}
          </section>
          {after?.index === i && after.node}
        </div>
      ))}
    </div>
  );
}
