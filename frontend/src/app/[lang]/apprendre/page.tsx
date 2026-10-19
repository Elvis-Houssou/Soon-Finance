import type { Metadata } from "next";
import { LearnIndex } from "@/components/learn/learn-index";
import { learnEntries } from "@/content/learn/articles";
import { readingMinutes } from "@/content/learn/types";
import { getDictionary, getLocale } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary(await getLocale())).learn.title };
}

export default async function LearnPage() {
  const locale = await getLocale();
  const { learn, methods } = await getDictionary(locale);
  const items = learnEntries.map((e) => ({
    slug: e.slug, kind: e.kind, minutes: readingMinutes(e, locale), title: e.title[locale], summary: e.summary[locale],
    hint: e.kind === "method" ? methods[e.slug as keyof typeof methods].hint : undefined,
  }));
  return (
    <div className="container-site flex flex-col gap-8 py-8 lg:py-12">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-semibold sm:text-5xl">{learn.title}</h1>
        <p className="text-lg text-muted">{learn.lead}</p>
      </div>
      <LearnIndex items={items} locale={locale} t={learn} />
      <p className="text-[13px] text-muted">{learn.disclaimer}</p>
    </div>
  );
}
