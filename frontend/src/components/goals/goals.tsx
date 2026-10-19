"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AccountNav } from "@/components/account/account-nav";
import { monthName } from "@/components/dashboard/format";
import type { Envelope } from "@/components/dashboard/types";
import { fill } from "@/components/simulator/shared";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/fr";
import { apiFetch, ApiError } from "@/lib/api";
import { formatAmount, formatMoney, parseAmount } from "@/lib/money";
import { useApi } from "@/lib/use-api";

type Goal = {
  id: string; label: string; target: number; deadline: string; saved: number;
  pace: { monthly_needed: number; on_track: boolean; projected: string | null };
};
type Me = { currency: string; essentials: number | null };
type Row = { year_month: string; income: number; envelopes: Envelope[] };
type Strings = Pick<Dictionary, "goals" | "account" | "dashboard">;

const MAX_GOALS = 3;
const MAX_MONTHS = 120;
const SAVE = ["save", "save2"];
const LINK = "flex min-h-11 w-fit items-center rounded-[10px] bg-brand px-5 font-semibold text-on-brand";
const OUTLINE = "flex min-h-11 items-center rounded-[10px] border px-3.5 text-sm font-semibold";
const INPUT = "h-12 w-full min-w-0 rounded-[10px] border border-line-input bg-surface px-3 text-base tabular-nums aria-[invalid=true]:border-danger";

const addMonths = (ym: string, n: number) => {
  const i = Number(ym.slice(0, 4)) * 12 + Number(ym.slice(5)) - 1 + n;
  return `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`;
};
const plannedSaving = (months: Row[], ym: string) => {
  const m = months.find((x) => x.year_month === ym) ?? months[0]; // GET /api/months is newest first
  return m ? m.envelopes.filter((e) => SAVE.includes(e.kind)).reduce((a, e) => a + e.planned, 0) : 0;
};

export function Goals({ locale, t }: { locale: Locale; t: Strings }) {
  const goals = useApi<Goal[]>("/api/goals");
  const me = useApi<Me>("/api/me");
  const months = useApi<Row[]>("/api/months");
  const g = t.goals;
  const my = (key: string) => `${monthName(key, locale)} ${key.slice(0, 4)}`;

  const [name, setName] = useState("");
  const [amountText, setAmountText] = useState("");
  const [monthsText, setMonthsText] = useState("");
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  const failed = goals.error || me.error || months.error;
  const ready = goals.data && me.data && months.data;
  const retry = () => { goals.reload(); me.reload(); months.reload(); };

  let body;
  if (failed) {
    body = (
      <div role="status" className="flex flex-col items-start gap-3 rounded-[14px] bg-sunken p-5">
        <p>{g.error}</p>
        <button type="button" onClick={retry} className={LINK}>{g.retry}</button>
      </div>
    );
  } else if (!ready) {
    body = <p role="status" aria-busy="true" className="min-h-svh text-muted">{g.loading}</p>;
  } else {
    const ym = new Date().toISOString().slice(0, 7); // only after data: the prerender must not freeze the date
    const list = goals.data!, cur = me.data!.currency;
    const money = (v: number) => formatMoney(v, cur, locale);
    const planned = plannedSaving(months.data!, ym);
    const income = (months.data!.find((x) => x.year_month === ym) ?? months.data![0])?.income ?? 0;
    const full = list.length >= MAX_GOALS;

    const target = parseAmount(amountText, cur);
    const n = /^\d+$/.test(monthsText.trim()) ? Number(monthsText) : 0;
    const nameOk = name.trim().length > 0, targetOk = !!target && target > 0, monthsOk = n >= 1 && n <= MAX_MONTHS;
    // Same formula as the backend goal_pace: ceil(target / months), nothing saved yet.
    const per = targetOk && monthsOk ? Math.ceil(target / n) : 0;
    const tooHigh = per > 0 && planned > 0 && per > planned;

    const run = async (fn: () => Promise<unknown>) => {
      setFailure(null);
      try { await fn(); goals.reload(); } catch (e) {
        setFailure(e instanceof ApiError && e.status === 409 ? g.limit : g.errGeneric);
        if (e instanceof ApiError && e.status === 409) goals.reload();
      }
    };
    const submit = async (e: FormEvent) => {
      e.preventDefault();
      setTried(true);
      if (sending || !nameOk || !targetOk || !monthsOk) return;
      setSending(true);
      await run(async () => {
        await apiFetch("/api/goals", {
          method: "POST",
          body: JSON.stringify({ label: name.trim(), target, deadline: addMonths(ym, n), saved: 0 }),
        });
        setName(""); setAmountText(""); setMonthsText(""); setTried(false);
      });
      setSending(false);
    };
    const reserve = me.data!.essentials ? me.data!.essentials * 3 : null;
    const count = list.length === 0 ? g.countZero : fill(g.count, { n: list.length, s: list.length > 1 ? "s" : "" });

    body = (
      <>
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">{g.heading}</h1>
          <p className="text-muted">{count}</p>
        </div>
        {list.length === 0 && (
          <section aria-label={g.emptyTitle} className="flex flex-col items-start gap-3 rounded-[14px] border border-dashed border-line-input p-5">
            <h2 className="font-display text-xl font-semibold">{g.emptyTitle}</h2>
            <p className="text-muted">{g.emptyText}</p>
            {reserve && (
              <button
                type="button" className={`${OUTLINE} border-brand-ink text-brand-ink`}
                onClick={() => { setName(g.reserveName); setAmountText(formatAmount(reserve, cur, locale)); setMonthsText("9"); }}
              >
                {fill(g.reserve, { amount: money(reserve) })}
              </button>
            )}
          </section>
        )}
        {list.map((goal) => {
          const p = Math.min(100, Math.round((goal.saved / goal.target) * 100));
          const { on_track: onTrack, projected, monthly_needed: needed } = goal.pace;
          const behind = !onTrack;
          return (
            <article key={goal.id} className="flex flex-col gap-2.5 rounded-[14px] border border-line bg-surface p-5">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="min-w-0 break-words font-display text-xl font-semibold">{goal.label}</h2>
                <span className="shrink-0 font-mono text-xs uppercase text-muted">{my(goal.deadline)}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-sunken" role="img" aria-label={`${p} %`}>
                <div data-grow="x" className="h-full bg-gold" style={{ width: `${p}%` }} />
              </div>
              <p className="text-sm text-muted tabular-nums">
                {fill(g.progress, { saved: money(goal.saved), target: money(goal.target), pct: p })}
              </p>
              {behind ? (
                <div role="status" className="flex flex-col gap-1 text-sm text-warning">
                  {projected
                    ? <p>{fill(g.behind, { month: my(projected) })} {fill(g.behindNeed, { amount: money(needed), deadline: my(goal.deadline) })}</p>
                    : <p>{fill(g.behindNone, { amount: money(needed), deadline: my(goal.deadline) })}</p>}
                </div>
              ) : (
                <p className="text-sm text-muted">{fill(g.onTrack, { amount: money(needed) })}</p>
              )}
              {confirming === goal.id ? (
                <div role="alertdialog" aria-label={g.confirm} className="flex flex-col gap-2 rounded-[10px] bg-sunken p-3.5">
                  <strong>{g.confirm}</strong>
                  <p className="text-sm">{fill(g.confirmText, { goal: goal.label })}</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button" className={`${OUTLINE} border-danger text-danger`}
                      onClick={async () => { await run(() => apiFetch(`/api/goals/${goal.id}`, { method: "DELETE" })); setConfirming(null); }}
                    >{g.confirmYes}</button>
                    <button type="button" className={`${OUTLINE} border-line`} onClick={() => setConfirming(null)}>{g.cancel}</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {behind && projected && (
                    <button
                      type="button" className={`${OUTLINE} border-brand-ink text-brand-ink`}
                      onClick={() => run(() => apiFetch(`/api/goals/${goal.id}`, { method: "PATCH", body: JSON.stringify({ deadline: projected }) }))}
                    >{fill(g.postpone, { month: my(projected) })}</button>
                  )}
                  {behind && (
                    <Link href={`/${locale}/simulateur`} className={`${OUTLINE} border-line`}>{g.saveMore}</Link>
                  )}
                  <button
                    type="button" aria-label={fill(g.removeLabel, { goal: goal.label })}
                    className={`${OUTLINE} border-line text-muted`} onClick={() => setConfirming(goal.id)}
                  >{g.remove}</button>
                </div>
              )}
            </article>
          );
        })}
        {failure && <p role="alert" className="text-danger">{failure}</p>}
        {full ? (
          <p role="status" className="rounded-[14px] bg-sunken p-5">{g.limit}</p>
        ) : (
          <form onSubmit={submit} noValidate className="flex flex-col gap-3.5 rounded-[14px] border border-line bg-surface p-5">
            <h2 className="font-display text-xl font-semibold">{g.formTitle}</h2>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="gname" className="font-semibold">{g.name}</label>
              <input
                id="gname" value={name} maxLength={60} placeholder={g.namePlaceholder} className={INPUT}
                aria-invalid={tried && !nameOk} aria-describedby={tried && !nameOk ? "gname-err" : undefined}
                onChange={(e) => setName(e.target.value)}
              />
              {tried && !nameOk && <span id="gname-err" className="text-sm text-danger">{g.nameError}</span>}
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex min-w-0 flex-col gap-1.5">
                <label htmlFor="gamt" className="font-semibold">{fill(g.amount, { currency: cur })}</label>
                <input
                  id="gamt" inputMode="numeric" value={amountText} className={INPUT}
                  aria-invalid={tried && !targetOk} aria-describedby={tried && !targetOk ? "gamt-err" : undefined}
                  onChange={(e) => setAmountText(e.target.value)}
                />
                {tried && !targetOk && <span id="gamt-err" className="text-sm text-danger">{g.amountError}</span>}
              </div>
              <div className="flex min-w-0 flex-col gap-1.5">
                <label htmlFor="gmonths" className="font-semibold">{g.months}</label>
                <input
                  id="gmonths" inputMode="numeric" value={monthsText} className={INPUT}
                  aria-invalid={tried && !monthsOk} aria-describedby={tried && !monthsOk ? "gmonths-err" : undefined}
                  onChange={(e) => setMonthsText(e.target.value)}
                />
                {tried && !monthsOk && <span id="gmonths-err" className="text-sm text-danger">{g.monthsError}</span>}
              </div>
            </div>
            {per > 0 && !tooHigh && (
              <p role="status" className="rounded-[10px] bg-tint p-3.5 leading-normal">
                <strong className="text-brand-ink">{fill(g.perMonth, { amount: money(per) })}</strong>
                {income > 0 && fill(g.share, { share: `${new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-GB", { maximumFractionDigits: 1 }).format((per / income) * 100)} %` })}.
              </p>
            )}
            {tooHigh && (
              <div role="status" className="flex flex-col items-start gap-2.5 rounded-[10px] bg-sunken p-3.5">
                <p className="leading-normal">
                  <strong className="text-warning">{fill(g.perMonth, { amount: money(per) })}.</strong>{" "}
                  {fill(g.tooHigh, { planned: money(planned), months: Math.min(MAX_MONTHS, Math.ceil(target! / planned)) })}
                </p>
                <button
                  type="button" className={`${OUTLINE} border-brand-ink text-brand-ink`}
                  onClick={() => setMonthsText(String(Math.min(MAX_MONTHS, Math.ceil(target! / planned))))}
                >{g.stretch}</button>
              </div>
            )}
            <button
              type="submit" disabled={sending}
              className="flex h-[52px] items-center justify-center rounded-[10px] bg-brand font-semibold text-on-brand disabled:opacity-60"
            >{sending ? g.adding : g.add}</button>
          </form>
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
