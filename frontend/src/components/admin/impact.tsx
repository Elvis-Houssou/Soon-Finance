"use client";

import { useState } from "react";
import { notFound } from "next/navigation";
import { cap, monthName } from "@/components/dashboard/format";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/fr";
import { CURRENCIES, formatMoney } from "@/lib/money";
import { useApi } from "@/lib/use-api";

type N = number | null;
type Data = {
  usage: { simulations: N; comparisons: N; signups_started: N; signups_completed: N; conversion_bp: N };
  retention: { cohort: string; users: N; m1_bp: N; m2_bp: N; m3_bp: N }[];
  savings: { median_rate_bp: N; improved_share_bp: N; helpfulness_avg_x100: N };
  amounts: { currency: string; saved_total: N }[];
  min_group: number;
  since: string;
};

const SELECT = "min-h-11 rounded-[10px] border border-line-input bg-surface px-3 text-base text-ink";
const BTN = "flex min-h-11 w-fit items-center rounded-[10px] bg-brand px-5 font-semibold text-on-brand";

export function Impact({ locale, t }: { locale: Locale; t: Dictionary["impact"] }) {
  const [days, setDays] = useState("30");
  const [currency, setCurrency] = useState("all");
  const [lang, setLang] = useState("all");
  const { data, error, reload } = useApi<Data>(`/admin/impact?days=${days}&currency=${currency}&locale=${lang}`);
  const tag = locale === "fr" ? "fr-FR" : "en-GB";
  const num = new Intl.NumberFormat(tag);
  const dec = new Intl.NumberFormat(tag, { maximumFractionDigits: 1 });

  // Non-admin : la page introuvable du site. Rien de la zone admin n'est rendu avant une première réponse de l'API.
  const [admitted, setAdmitted] = useState(false);
  if (error?.status === 404) notFound();
  if (data && !admitted) setAdmitted(true);
  if (!admitted && !data)
    return <p role="status" aria-busy={!error} className="container-site min-h-svh py-8 text-muted">{error ? t.error : t.loading}</p>;

  // null = groupe de moins de 5 personnes : « — », annoncé « chiffre masqué » aux lecteurs d'écran.
  const show = (v: N, f: (n: number) => string) => (v === null ? <span aria-label={t.maskedShort}>—</span> : f(v));
  const pct = (bp: number) => `${dec.format(bp / 100)} %`;

  let body;
  if (error) {
    body = (
      <div role="status" className="flex flex-col items-start gap-3 rounded-[14px] bg-sunken p-5">
        <p>{t.error}</p>
        <button type="button" onClick={reload} className={BTN}>{t.retry}</button>
      </div>
    );
  } else if (!data) {
    body = <p role="status" aria-busy="true" className="min-h-svh text-muted">{t.loading}</p>;
  } else {
    const { usage, savings, retention, amounts } = data;
    const kpi = (label: string, value: React.ReactNode) => (
      <div className="flex flex-col gap-1.5">
        <dt className="text-sm text-on-brand-muted">{label}</dt>
        <dd className="font-display text-4xl font-semibold tabular-nums">{value}</dd>
      </div>
    );
    const use = (label: string, value: React.ReactNode) => (
      <div className="flex items-baseline justify-between gap-3 border-b border-line py-2 last:border-0">
        <dt>{label}</dt>
        <dd className="font-semibold tabular-nums">{value}</dd>
      </div>
    );
    body = (
      <>
        <section aria-labelledby="imp-a" className="flex flex-col gap-5 rounded-[14px] bg-brand p-5 text-on-brand sm:p-8">
          <h2 id="imp-a" className="text-lg font-semibold">{t.savingsTitle}</h2>
          <dl className="grid gap-6 sm:grid-cols-3">
            {kpi(t.median, show(savings.median_rate_bp, pct))}
            {kpi(t.improved, show(savings.improved_share_bp, pct))}
            {kpi(t.helpfulness, show(savings.helpfulness_avg_x100, (n) => `${dec.format(n / 100)} / 5`))}
          </dl>
          <p className="text-sm text-on-brand-muted">{t.savingsNote}</p>
          {amounts.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold">{t.amounts}</h3>
              <dl className="flex flex-wrap gap-x-8 gap-y-2 tabular-nums">
                {amounts.map((a) => (
                  <div key={a.currency} className="flex gap-2">
                    <dt className="text-on-brand-muted">{a.currency}</dt>
                    <dd className="font-semibold">
                      {show(a.saved_total, (n) => formatMoney(n, a.currency in CURRENCIES ? a.currency : "XOF", locale))}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </section>

        <div className="grid gap-5 lg:grid-cols-2">
          <section aria-labelledby="imp-c" className="flex flex-col gap-3 rounded-[14px] border border-line bg-surface p-5">
            <h2 id="imp-c" className="text-lg font-semibold">{t.usageTitle}</h2>
            <dl>
              {use(t.simulations, show(usage.simulations, num.format))}
              {use(t.signupsStarted, show(usage.signups_started, num.format))}
              {use(t.signupsCompleted, show(usage.signups_completed, num.format))}
              {use(t.conversion, show(usage.conversion_bp, pct))}
              {use(t.comparisons, show(usage.comparisons, num.format))}
            </dl>
          </section>

          <section aria-labelledby="imp-b" className="flex min-w-0 flex-col gap-3 rounded-[14px] border border-line bg-surface p-5">
            <h2 id="imp-b" className="text-lg font-semibold">{t.retentionTitle}</h2>
            {retention.length === 0 ? (
              <p className="text-muted">{t.noCohort}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left tabular-nums">
                  <thead>
                    <tr className="text-sm text-muted">
                      <th scope="col" className="py-2 pr-3 font-medium">{t.cohort}</th>
                      <th scope="col" className="py-2 pr-3 font-medium">{t.signedUp}</th>
                      <th scope="col" className="py-2 pr-3 font-medium">M1</th>
                      <th scope="col" className="py-2 pr-3 font-medium">M2</th>
                      <th scope="col" className="py-2 font-medium">M3</th>
                    </tr>
                  </thead>
                  <tbody>
                    {retention.map((r) => (
                      <tr key={r.cohort} className="border-t border-line">
                        <th scope="row" className="py-2 pr-3 font-medium">{cap(monthName(r.cohort, locale))} {r.cohort.slice(0, 4)}</th>
                        <td className="py-2 pr-3">{show(r.users, num.format)}</td>
                        <td className="py-2 pr-3">{show(r.m1_bp, pct)}</td>
                        <td className="py-2 pr-3">{show(r.m2_bp, pct)}</td>
                        <td className="py-2">{show(r.m3_bp, pct)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-sm text-muted">{t.retentionNote}</p>
          </section>
        </div>
        <p className="text-sm text-muted">{t.masked}</p>
      </>
    );
  }

  return (
    <main id="main" className="container-site flex flex-col gap-6 py-8">
      <div className="flex flex-col gap-2">
        <p className="w-fit rounded-full bg-ink px-3 py-1 font-mono text-xs tracking-widest text-bg uppercase">{t.badge}</p>
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">{t.heading}</h1>
        <p className="font-mono text-sm text-warning">{t.note}</p>
      </div>
      <form aria-label={t.filters} className="flex flex-wrap gap-3" onSubmit={(e) => e.preventDefault()}>
        <label className="flex flex-col gap-1 text-sm text-muted">
          {t.period}
          <select value={days} onChange={(e) => setDays(e.target.value)} className={SELECT}>
            {Object.entries(t.periods).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-muted">
          {t.currency}
          <select value={currency} onChange={(e) => { setCurrency(e.target.value); setLang("all"); }} className={SELECT}>
            <option value="all">{t.allCurrencies}</option>
            {Object.keys(CURRENCIES).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-muted">
          {t.locale}
          <select value={lang} onChange={(e) => { setLang(e.target.value); setCurrency("all"); }} className={SELECT}>
            <option value="all">{t.allLocales}</option>
            <option value="fr">FR</option>
            <option value="en">EN</option>
          </select>
        </label>
      </form>
      {data && (
        <p className="text-sm text-muted">
          {t.since} {new Intl.DateTimeFormat(tag, { dateStyle: "long", timeZone: "UTC" }).format(new Date(data.since))}
        </p>
      )}
      {body}
    </main>
  );
}
