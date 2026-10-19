import Link from "next/link";
import { HeroSunrise } from "@/components/home/hero-sunrise";
import { HowItWorks } from "@/components/home/how-it-works";
import { QuickStart } from "@/components/home/quick-start";
import data from "@/content/methods.json";
import { getDictionary, getLocale } from "@/i18n/server";

export default async function HomePage() {
  const locale = await getLocale();
  const t = await getDictionary(locale);
  const sim = `/${locale}/simulateur`;
  const h2 = "font-display text-3xl font-semibold";

  return (
    <>
      <HeroSunrise title={t.home.title} lead={t.home.lead}>
        <QuickStart locale={locale} t={t} />
      </HeroSunrise>
      <div className="container-site flex flex-col gap-16 py-16">
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

        <HowItWorks title={t.home.stepsTitle} steps={t.home.steps} />

        <section aria-labelledby="trust" className="flex flex-col items-start gap-4 rounded-[14px] border border-line bg-surface p-6 sm:p-10">
          <h2 id="trust" className={h2}>{t.home.trustTitle}</h2>
          <p className="max-w-2xl text-muted">{t.home.trustText}</p>
          <Link href={sim} className="flex min-h-12 items-center rounded-[10px] bg-brand px-5 font-semibold text-on-brand">{t.home.trustCta}</Link>
        </section>
      </div>
    </>
  );
}
