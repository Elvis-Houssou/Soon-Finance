"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AccountNav } from "@/components/account/account-nav";
import { SuggestionText } from "@/components/learn/suggestion-text";
import { SunHorizon } from "@/components/horizon/sun-horizon";
import { fill } from "@/components/simulator/shared";
import type { Locale } from "@/i18n/config";
import { apiFetch } from "@/lib/api";
import { formatMoney } from "@/lib/money";
import { loadDraft, onboardingBody } from "@/lib/simulation";
import { useApi } from "@/lib/use-api";
import { FirstRun } from "./first-run";
import { cap, envLabel, monthName } from "./format";
import type { Ctx, DashboardData, DashStrings } from "./types";

const LINK = "flex min-h-11 w-fit items-center rounded-[10px] bg-brand px-5 font-semibold text-on-brand";
const monthYear = (ym: string, locale: Locale) => `${monthName(ym, locale)} ${ym.slice(0, 4)}`;

export function suggestionItems(data: DashboardData, { locale, t }: Ctx) {
  return data.suggestions.flatMap((s) => {
    const tpl = (t.suggestions as Record<string, string>)[s.id];
    if (!tpl) return [];
    const money = (v: unknown) => formatMoney(Number(v), data.currency, locale);
    const vars: Record<string, string> = {};
    if (s.id === "envelope-overspent") {
      vars.key = envLabel(t, data.current_month?.method ?? "", { label: String(s.params.key), kind: "" });
    } else if (s.id === "close-previous-month") {
      vars.month = monthName(String(s.params.year_month), locale);
    } else if (s.id === "goal-behind") {
      vars.goal = data.goals.find((g) => g.id === s.params.goal_id)?.label ?? "";
      vars.amount = money(s.params.monthly_needed);
      // `projected` can be absent: that part of the sentence is then left out.
      const extra = typeof s.params.projected === "string"
        ? ` ${fill(t.dashboard.goalProjected, { month: monthYear(s.params.projected, locale) })}` : "";
      return [{ id: s.id, text: fill(tpl, vars) + extra }];
    } else {
      for (const [k, v] of Object.entries(s.params)) vars[k] = typeof v === "number" ? money(v) : v;
    }
    return [{ id: s.id, text: fill(tpl, vars) }];
  });
}

export const suggestionTexts = (data: DashboardData, c: Ctx) => suggestionItems(data, c).map((i) => i.text);

function Tracking({ data, locale, t }: Ctx & { data: DashboardData }) {
  const d = t.dashboard;
  const cur = data.current_month;
  const open = cur && !cur.closed_at ? cur : null;
  const since = data.rates[0] ? monthName(data.rates[0].year_month, locale) : "";
  const pct = new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-GB", { maximumFractionDigits: 1 });
  const rates = data.rates.slice(-2)
    .map((r) => fill(d.rateIn, { rate: pct.format(r.savings_rate_bp / 100), month: monthName(r.year_month, locale) }))
    .join(", ");
  const hello = data.first_name ? fill(d.hello, { name: data.first_name }) : d.helloNoName;
  const method = cur ? (t.methods as Record<string, { name: string }>)[cur.method]?.name ?? cur.method : "";
  const tips = suggestionItems(data, { locale, t });
  const prev = data.suggestions.find((s) => s.id === "close-previous-month");
  const label = data.steps === 1 ? d.sunLabelOne : fill(d.sunLabel, { n: data.steps });
  const title = cur ? fill(d.monthTitle, { month: cap(monthName(cur.year_month, locale)) }) : "";

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6">
      <div className="flex flex-col gap-1">
        {cur && data.steps >= 2 && (
          <p className="text-muted">{hello} · {fill(d.context, { month: monthName(cur.year_month, locale), method })}</p>
        )}
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">
          {data.steps >= 2 ? fill(d.progressTitle, { month: since }) : hello}
        </h1>
      </div>
      <section aria-label={d.progress} className="flex flex-col gap-3 rounded-[14px] bg-tint p-5">
        <span className="text-muted">{fill(d.savedSince, { month: since })}</span>
        <strong className="font-display text-3xl tabular-nums">{formatMoney(data.saved_total, data.currency, locale)}</strong>
        <SunHorizon steps={data.steps} label={label} size="lg" animateOnMount />
        <p className="text-muted">{fill(d.sunCaption, { rates })}</p>
      </section>
      {cur && (
        <section aria-label={title} className="flex flex-col gap-4 rounded-[14px] border border-line bg-surface p-5">
          <h2 className="text-[17px] font-semibold">{title}</h2>
          {cur.envelopes.map((e, i) => {
            const over = e.actual !== null && e.actual > e.planned && e.kind !== "save" && e.kind !== "save2";
            return (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="flex justify-between gap-3">
                  <span>{envLabel(t, cur.method, e)}</span>
                  <span className="tabular-nums">
                    {e.actual !== null && <strong>{formatMoney(e.actual, cur.currency, locale)} / </strong>}
                    <span className="text-muted">{formatMoney(e.planned, cur.currency, locale)}</span>
                  </span>
                </div>
                {e.actual !== null && (
                  <div className="h-2 overflow-hidden rounded-full bg-sunken">
                    <div className="h-full bg-chart-1" style={{ width: `${Math.min(100, e.planned ? (e.actual / e.planned) * 100 : 0)}%` }} />
                  </div>
                )}
                {over && (
                  <span className="text-sm text-warning">{fill(d.over, { amount: formatMoney(e.actual! - e.planned, cur.currency, locale) })}</span>
                )}
              </div>
            );
          })}
          {open && (
            <Link href={`/${locale}/bilan/${open.year_month}`} className={LINK}>{fill(d.close, { month: monthName(open.year_month, locale) })}</Link>
          )}
        </section>
      )}
      {tips.length > 0 && (
        <section aria-label={d.tips} className="flex flex-col gap-3">
          <h2 className="text-[17px] font-semibold">{d.tips}</h2>
          {tips.map(({ id, text }, i) => (
            <article key={i} className="rounded-[14px] bg-tint p-5">
              <p>
                <SuggestionText id={id} text={text} locale={locale} />
              </p>
            </article>
          ))}
          {prev && (
            <Link href={`/${locale}/bilan/${String(prev.params.year_month)}`} className={LINK}>
              {fill(d.close, { month: monthName(String(prev.params.year_month), locale) })}
            </Link>
          )}
        </section>
      )}
      {data.goals.length > 0 && (
        <section aria-label={d.goals} className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[17px] font-semibold">{d.goals}</h2>
            <Link href={`/${locale}/objectifs`} className="flex min-h-11 items-center font-semibold text-brand-ink underline">{d.seeAll}</Link>
          </div>
          {data.goals.map((g) => {
            const p = Math.min(100, Math.round((g.saved / g.target) * 100));
            return (
              <div key={g.id} className="flex flex-col gap-1.5 rounded-[14px] border border-line bg-surface p-5">
                <div className="flex justify-between gap-3">
                  <strong>{g.label}</strong>
                  <span className="text-sm text-muted">{fill(d.goalDeadline, { month: monthYear(g.deadline, locale) })}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-sunken"><div className="h-full bg-chart-1" style={{ width: `${p}%` }} /></div>
                <span className="tabular-nums">
                  {fill(d.goalOf, { saved: formatMoney(g.saved, data.currency, locale), target: formatMoney(g.target, data.currency, locale), pct: p })}
                </span>
                {g.pace.projected && <span className="text-muted">{fill(d.goalProjected, { month: monthYear(g.pace.projected, locale) })}</span>}
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}

export function Dashboard({ locale, t }: { locale: Locale; t: DashStrings }) {
  const { data, error, reload } = useApi<DashboardData>("/api/dashboard");
  const [importing, setImporting] = useState(false);
  const tried = useRef(false);
  const d = t.dashboard;

  // The simulator draft becomes this month's budget once, right after sign-up.
  useEffect(() => {
    if (!data || data.current_month || data.closed_count > 0 || tried.current) return;
    tried.current = true;
    const draft = loadDraft();
    if (draft.income <= 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setImporting(true);
    apiFetch("/api/onboarding", { method: "POST", body: JSON.stringify(onboardingBody(draft)) })
      .then(reload, () => setImporting(false));
  }, [data, reload]);

  let body;
  if (error) {
    body = (
      <div role="status" className="flex flex-col items-start gap-3 rounded-[14px] bg-sunken p-5">
        <p>{d.error}</p>
        <button type="button" onClick={reload} className={LINK}>{d.retry}</button>
      </div>
    );
  } else if (!data || (importing && !data.current_month)) {
    body = <p role="status" aria-busy="true" className="min-h-svh text-muted">{d.loading}</p>;
  } else if (data.closed_count === 0 && data.current_month) {
    body = <FirstRun locale={locale} t={t} month={data.current_month} />;
  } else if (data.closed_count === 0) {
    body = (
      <div className="flex flex-1 flex-col items-start gap-4">
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">{d.emptyTitle}</h1>
        <p className="text-lg text-muted">{d.emptyText}</p>
        <Link href={`/${locale}/simulateur`} className={LINK}>{d.emptyCta}</Link>
      </div>
    );
  } else {
    body = <Tracking data={data} locale={locale} t={t} />;
  }

  return (
    <div className="container-site flex flex-col gap-6 py-8 pb-24 lg:flex-row lg:gap-10 lg:py-12 lg:pb-12">
      <AccountNav locale={locale} t={t.account} />
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        {body}
        <p className="text-[13px] text-muted">{d.disclaimer}</p>
      </div>
    </div>
  );
}
