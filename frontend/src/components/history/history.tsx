"use client";

import Link from "next/link";
import { AccountNav } from "@/components/account/account-nav";
import { cap, monthName } from "@/components/dashboard/format";
import type { Envelope } from "@/components/dashboard/types";
import { fill } from "@/components/simulator/shared";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/fr";
import { formatMoney } from "@/lib/money";
import { useApi } from "@/lib/use-api";

type Row = {
  year_month: string; currency: string; method: string; envelopes: Envelope[];
  closed_at: string | null; savings_rate_bp: number | null;
};
type Strings = Pick<Dictionary, "history" | "account" | "dashboard" | "methods">;

const SAVE = ["save", "save2"];
const LINK = "flex min-h-11 w-fit items-center rounded-[10px] bg-brand px-5 font-semibold text-on-brand";
const CHART_MONTHS = 6;

export function History({ locale, t }: { locale: Locale; t: Strings }) {
  const { data, error, reload } = useApi<Row[]>("/api/months");
  const h = t.history;
  const pct = new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-GB", { maximumFractionDigits: 1 });
  const rate = (bp: number) => `${pct.format(bp / 100)} %`;

  let body;
  if (error) {
    body = (
      <div role="status" className="flex flex-col items-start gap-3 rounded-[14px] bg-sunken p-5">
        <p>{h.error}</p>
        <button type="button" onClick={reload} className={LINK}>{h.retry}</button>
      </div>
    );
  } else if (!data) {
    body = <p role="status" aria-busy="true" className="min-h-svh text-muted">{h.loading}</p>;
  } else {
    const isClosed = (m: Row) => m.closed_at !== null && m.savings_rate_bp !== null;
    const closed = data.filter(isClosed);
    const asc = [...data].reverse();
    // Closed months plus the latest open one (dashed), last few only so labels stay legible at 360 px.
    const shown = asc.filter((m) => isClosed(m) || m === asc[asc.length - 1]).slice(-CHART_MONTHS);
    const max = Math.max(1, ...closed.map((m) => m.savings_rate_bp!));
    const count = closed.length === 0 ? h.countZero : closed.length === 1 ? h.countOne : fill(h.countMany, { n: closed.length });
    const summary = shown
      .map((m) => (isClosed(m)
        ? `${cap(monthName(m.year_month, locale))} ${rate(m.savings_rate_bp!)}`
        : fill(h.chartOpen, { month: cap(monthName(m.year_month, locale)) })))
      .join(", ");
    const saved = (m: Row, f: "actual" | "planned") => m.envelopes.filter((e) => SAVE.includes(e.kind)).reduce((a, e) => a + (e[f] ?? 0), 0);
    const methodName = (k: string) => (t.methods as Record<string, { name: string }>)[k]?.name ?? k;

    body = (
      <>
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">{h.title}</h1>
          <p className="text-muted">{count}</p>
        </div>
        {closed.length === 0 ? (
          <section aria-label={h.emptyTitle} className="flex flex-col items-start gap-3 rounded-[14px] border border-dashed border-line-input p-6">
            <h2 className="font-display text-xl font-semibold">{h.emptyTitle}</h2>
            <p className="text-muted">{h.emptyText}</p>
            <Link href={`/${locale}/tableau-de-bord`} className="flex min-h-11 items-center rounded-[10px] border border-brand-ink px-4 font-semibold">{h.emptyCta}</Link>
          </section>
        ) : (
          <section aria-label={h.chart} className="flex flex-col gap-3.5 rounded-[14px] border border-line bg-surface p-5">
            <h2 className="text-base font-semibold">{h.chart}</h2>
            <div role="img" aria-label={fill(h.chartLabel, { values: summary })} className="flex flex-col gap-2">
              <div className="flex h-[150px] items-end gap-2 sm:gap-4">
                {shown.map((m) => (
                  <div key={m.year_month} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
                    <span className="text-[13px] tabular-nums">
                      {isClosed(m) ? rate(m.savings_rate_bp!) : <span className="text-muted">{h.open}</span>}
                    </span>
                    {isClosed(m) ? (
                      <div data-grow="y" className="w-full rounded-t-md bg-chart-1" style={{ height: `${Math.max(4, Math.round((m.savings_rate_bp! / max) * 90))}%` }} />
                    ) : (
                      <div className="h-full w-full rounded-t-md border-[1.5px] border-b-0 border-dashed border-line-input" />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 border-t border-line pt-2 text-center font-mono text-xs uppercase text-muted sm:gap-4">
                {shown.map((m) => (
                  <span key={m.year_month} className="min-w-0 flex-1 truncate">{monthName(m.year_month, locale).slice(0, 4)}</span>
                ))}
              </div>
            </div>
          </section>
        )}
        {data.length > 0 && (
          <ul aria-label={h.list} className="flex flex-col gap-2.5">
            {data.map((m) => {
              const done = isClosed(m);
              const planned = formatMoney(saved(m, "planned"), m.currency, locale);
              const method = methodName(m.method);
              return (
                <li key={m.year_month}>
                  <Link
                    href={`/${locale}/bilan/${m.year_month}${done ? "/termine" : ""}`}
                    className="flex min-h-11 flex-col gap-1.5 rounded-[14px] border border-line bg-surface p-4"
                  >
                    <span className="flex items-center justify-between gap-2">
                      <strong className="text-[17px]">{cap(monthName(m.year_month, locale))} {m.year_month.slice(0, 4)}</strong>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[13px] font-semibold ${done ? "bg-tint" : "border border-line-input text-muted"}`}>
                        {done ? fill(h.statusClosed, { rate: rate(m.savings_rate_bp!) }) : h.statusOpen}
                      </span>
                    </span>
                    <span className="text-sm text-muted tabular-nums">
                      {done
                        ? fill(h.line, { method, saved: formatMoney(saved(m, "actual"), m.currency, locale), planned })
                        : fill(h.lineOpen, { method, planned })}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </>
    );
  }

  return (
    <div className="container-site flex flex-col gap-6 py-8 pb-24 lg:flex-row lg:gap-10 lg:py-12 lg:pb-12">
      <AccountNav locale={locale} t={t.account} />
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        {body}
        <p className="text-[13px] text-muted">{t.dashboard.disclaimer}</p>
      </div>
    </div>
  );
}
