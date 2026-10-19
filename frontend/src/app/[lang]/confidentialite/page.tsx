import type { Metadata } from "next";
import Link from "next/link";
import { legal, PLACEHOLDERS } from "@/content/legal";
import { getLocale } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: legal.title[await getLocale()] };
}

const H2 = "font-display text-2xl font-semibold scroll-mt-20";

export default async function PrivacyPage() {
  const l = await getLocale();
  const toc = [...legal.sections, { id: "mentions", heading: legal.mentions.heading }];
  return (
    <div className="container-site flex max-w-3xl flex-col gap-8 py-8 lg:py-12">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted">{legal.updated[l]} {PLACEHOLDERS.date}</p>
        <h1 className="font-display text-3xl font-semibold sm:text-5xl">{legal.title[l]}</h1>
        <p className="text-lg text-muted">{legal.lead[l]}</p>
      </div>
      <nav aria-label={legal.toc[l]}>
        <ul className="flex flex-wrap gap-2">
          {toc.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="flex min-h-11 items-center rounded-full border border-line bg-surface px-4 text-sm">{s.heading[l]}</a>
            </li>
          ))}
        </ul>
      </nav>
      {legal.sections.map((s) => (
        <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="flex flex-col gap-3">
          <h2 id={`${s.id}-h`} className={H2}>{s.heading[l]}</h2>
          {s.bullets && (
            <ul className="flex list-disc flex-col gap-2 pl-5 leading-relaxed">
              {s.bullets[l].map((b) => <li key={b}>{b}</li>)}
            </ul>
          )}
          {s.callout && <p className="rounded-[10px] bg-tint p-4">{s.callout[l]}</p>}
          {s.paragraphs?.[l].map((p) => <p key={p} className="leading-relaxed">{p}</p>)}
          {s.settingsLink && (
            <p className="leading-relaxed">
              {s.settingsLink[l][0]}
              <Link href={`/${l}/parametres`} className="font-semibold text-brand-ink underline">{s.settingsLink[l][1]}</Link>
              {s.settingsLink[l][2]}
            </p>
          )}
          {s.id === "droits" && <p>{legal.contact[l]} <strong>{PLACEHOLDERS.email}</strong></p>}
        </section>
      ))}
      <section id="mentions" aria-labelledby="mentions-h" className="flex flex-col gap-3 border-t border-line pt-6">
        <h2 id="mentions-h" className={H2}>{legal.mentions.heading[l]}</h2>
        <dl className="flex flex-col gap-3">
          {legal.mentions.items.map((it) => {
            const value = [it.value[l], ...it.placeholders.map((p) => PLACEHOLDERS[p as keyof typeof PLACEHOLDERS])].filter(Boolean).join(" · ");
            return (
              <div key={it.label.en}>
                <dt className="font-semibold">{it.label[l]}</dt>
                <dd className="break-words text-muted">{value}</dd>
              </div>
            );
          })}
        </dl>
      </section>
    </div>
  );
}
