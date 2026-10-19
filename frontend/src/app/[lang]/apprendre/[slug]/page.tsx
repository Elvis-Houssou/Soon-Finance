import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleBody } from "@/components/learn/article-body";
import { fill } from "@/components/simulator/shared";
import { learnEntries } from "@/content/learn/articles";
import methodsData from "@/content/methods.json";
import { locales } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/server";
import { formatAmount, split } from "@/lib/money";

const INCOME = 500_000;
const SAVE_KINDS = ["save", "save2"];

export const generateStaticParams = () =>
  locales.flatMap((lang) => learnEntries.map((e) => ({ lang, slug: e.slug })));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ slug }, locale] = await Promise.all([params, getLocale()]);
  const entry = learnEntries.find((e) => e.slug === slug);
  return entry ? { title: entry.title[locale] } : {};
}

export default async function LearnEntryPage({ params }: Props) {
  const [{ slug }, locale] = await Promise.all([params, getLocale()]);
  const i = learnEntries.findIndex((e) => e.slug === slug);
  if (i < 0) notFound();
  const entry = learnEntries[i];
  const { learn, envelopes, methods } = await getDictionary(locale);
  const money = (n: number) => formatAmount(n, "XOF", locale);
  const env = (k: string) => envelopes[k as keyof typeof envelopes];

  const method = entry.example && methodsData.methods.find((m) => m.id === entry.example!.methodId);
  let example: React.ReactNode = null;
  if (method) {
    const amounts = split(INCOME, method.envelopes.map((e) => e.pct));
    const saved = method.envelopes.reduce((a, e, k) => a + (SAVE_KINDS.includes(e.kind) ? amounts[k] : 0), 0);
    example = (
      <section aria-labelledby="example" className="flex flex-col gap-4 rounded-[14px] bg-tint p-5 sm:p-8">
        <h2 id="example" className="text-[13px] font-semibold tracking-wide text-brand-ink uppercase">{learn.example}</h2>
        <ul className="flex flex-col gap-2">
          {method.envelopes.map((e, k) => (
            <li key={e.key} className="flex flex-col gap-1">
              <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-3">
                <span>{env(e.key)} <span className="font-mono text-xs text-muted">{e.pct} %</span></span>
                <strong className="font-display text-xl font-semibold tabular-nums">{money(amounts[k])}</strong>
              </div>
              {e.children.length > 0 && (
                <ul className="flex flex-col gap-1 pl-5 text-[15px]">
                  {split(amounts[k], e.children.map((c) => c.pct)).map((a, c) => (
                    <li key={e.children[c].key} className="flex flex-wrap justify-between gap-x-3">
                      <span>{env(e.children[c].key)} <span className="font-mono text-xs text-muted">{e.children[c].pct} %</span></span>
                      <span className="tabular-nums">{money(a)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
        {saved > 0 && <p>{fill(learn.perYear, { amount: money(saved * 12) })}</p>}
      </section>
    );
  }

  const next = [1, 2].map((d) => learnEntries[(i + d) % learnEntries.length]);
  return (
    <article className="container-site flex max-w-3xl flex-col gap-8 py-8 lg:py-12">
      <Link href={`/${locale}/apprendre`} className="flex min-h-11 w-fit items-center font-semibold text-brand-ink">
        {learn.back}
      </Link>
      <header className="flex flex-col gap-3">
        <p className="text-[13px] font-semibold text-muted">
          {entry.kind === "method" ? learn.sheet : learn.article} · {fill(learn.minutesRead, { n: entry.minutes })}
        </p>
        <h1 className="font-display text-3xl font-semibold sm:text-5xl">
          {entry.kind === "method" ? methods[entry.slug as keyof typeof methods].name : entry.title[locale]}
        </h1>
        <p className="text-lg text-muted">{entry.summary[locale]}</p>
      </header>
      <ArticleBody entry={entry} locale={locale} after={example ? { index: 0, node: example } : undefined} />
      {method && (
        <Link
          href={`/${locale}/simulateur?methode=${method.id}`}
          className="flex min-h-14 w-fit items-center rounded-[10px] bg-brand px-7 text-[17px] font-semibold text-on-brand"
        >
          {learn.tryIt}
        </Link>
      )}
      <nav aria-label={learn.next} className="flex flex-col gap-2 border-t border-line pt-6">
        <h2 className="text-[13px] font-semibold tracking-wide text-muted uppercase">{learn.next}</h2>
        {next.map((n) => (
          <Link key={n.slug} href={`/${locale}/apprendre/${n.slug}`} className="flex min-h-11 w-fit items-center font-semibold text-brand-ink">
            {n.title[locale]}
          </Link>
        ))}
      </nav>
      <p className="text-[13px] text-muted">{learn.disclaimer}</p>
    </article>
  );
}
