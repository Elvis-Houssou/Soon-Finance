import Link from "next/link";
import { QuickStart } from "@/components/home/quick-start";
import data from "@/content/methods.json";
import { getDictionary, getLocale } from "@/i18n/server";

export default async function HomePage() {
  const locale = await getLocale();
  const t = await getDictionary(locale);
  const sim = `/${locale}/simulateur`;
  const h2 = "font-display text-3xl font-semibold";

  return (
    <div className="container-site flex flex-col gap-16 py-8 lg:py-16">
      <section className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div className="flex flex-col gap-4">
          <h1 className="font-display text-4xl font-bold sm:text-5xl lg:text-6xl">{t.home.title}</h1>
          <p className="text-lg text-muted">{t.home.lead}</p>
        </div>
        <QuickStart locale={locale} t={t} />
      </section>

      <section aria-labelledby="methods" className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 id="methods" className={h2}>{t.home.methodsTitle}</h2>
          <p className="text-muted">{t.home.methodsLead}</p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.methods.map((m) => {
            const info = t.methods[m.id as keyof typeof t.methods];
            return (
              <li key={m.id}>
                <Link href={`${sim}?methode=${m.id}`} className="flex h-full min-h-11 flex-col gap-1 rounded-[14px] border border-line bg-surface p-5 hover:border-ink">
                  <span className="font-display text-xl font-semibold">{info.name}</span>
                  <span className="text-muted">{info.description}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="steps" className="flex flex-col gap-6">
        <h2 id="steps" className={h2}>{t.home.stepsTitle}</h2>
        <ol className="grid gap-6 md:grid-cols-3">
          {t.home.steps.map((s, i) => (
            <li key={s.title} className="flex gap-4">
              <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand font-display font-bold text-on-brand">{i + 1}</span>
              <div className="flex flex-col gap-1">
                <h3 className="font-display text-xl font-semibold">{s.title}</h3>
                <p className="text-muted">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="trust" className="flex flex-col items-start gap-4 rounded-[14px] border border-line bg-surface p-6 sm:p-10">
        <h2 id="trust" className={h2}>{t.home.trustTitle}</h2>
        <p className="max-w-2xl text-muted">{t.home.trustText}</p>
        <Link href={sim} className="flex min-h-12 items-center rounded-[10px] bg-brand px-5 font-semibold text-on-brand">{t.home.trustCta}</Link>
      </section>
    </div>
  );
}
