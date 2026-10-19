"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { envLabel, monthName } from "@/components/dashboard/format";
import type { Envelope, MonthData, MonthStrings } from "@/components/dashboard/types";
import { fill, FIELD, KIND_BG } from "@/components/simulator/shared";
import type { Kind } from "@/lib/simulation";
import type { Locale } from "@/i18n/config";
import { ApiError, apiFetch } from "@/lib/api";
import { CURRENCIES, formatAmount, formatMoney, parseAmount } from "@/lib/money";
import { useApi } from "@/lib/use-api";

type Month = MonthData & { review: { went_well: string | null; change_next: string | null } | null; helpfulness: number | null };
const SAVE = ["save", "save2"];
const BTN = "flex min-h-11 w-full items-center justify-center rounded-[10px] px-5 font-semibold";

function Form({ month, locale, t }: { month: Month; locale: Locale; t: MonthStrings }) {
  const m = t.month;
  const router = useRouter();
  const cur = month.currency;
  const name = monthName(month.year_month, locale);
  const [vals, setVals] = useState(() =>
    month.envelopes.map((e) => (e.actual === null ? "" : formatAmount(e.actual, cur, locale))));
  const [well, setWell] = useState(month.review?.went_well ?? "");
  const [change, setChange] = useState(month.review?.change_next ?? "");
  const [rating, setRating] = useState<number | null>(month.helpfulness);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");

  const actuals = vals.map((v) => parseAmount(v, cur) ?? 0);
  const gap = month.income - actuals.reduce((a, b) => a + b, 0);
  const saved = actuals.reduce((a, v, i) => a + (SAVE.includes(month.envelopes[i].kind) ? v : 0), 0);
  const rate = new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-GB", { maximumFractionDigits: 1 })
    .format(month.income ? (saved / month.income) * 100 : 0);
  const money = (n: number) => formatMoney(n, cur, locale);
  const set = (i: number, v: string) => setVals((p) => p.map((x, j) => (j === i ? v : x)));

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (gap !== 0 || sending) return;
    setSending(true);
    setErr("");
    try {
      await apiFetch(`/api/months/${month.year_month}/close`, {
        method: "POST",
        body: JSON.stringify({ actuals, went_well: well.trim() || null, change_next: change.trim() || null, helpfulness: rating }),
      });
      router.push(`/${locale}/bilan/${month.year_month}/termine`);
    } catch (e) {
      const detail = e instanceof ApiError ? (e.detail as { detail?: string } | undefined)?.detail : undefined;
      setErr(detail === "totals_mismatch" ? m.errMismatch : detail === "locked" ? m.errLocked : detail === "future" ? m.errFuture : m.errGeneric);
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex min-w-0 flex-1 flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-semibold">{fill(m.heading, { month: name })}</h1>
        <p className="text-muted">{m.lead}</p>
      </div>
      <fieldset className="flex min-w-0 flex-col gap-4 rounded-[14px] border border-line bg-surface p-5">
        <legend className="px-1.5 font-display text-lg font-semibold">{m.actuals}</legend>
        <button
          type="button" className="min-h-11 w-fit rounded-full border border-line-input px-4 text-sm"
          onClick={() => setVals(month.envelopes.map((e) => formatAmount(e.planned, cur, locale)))}
        >{m.fillPlanned}</button>
        {month.envelopes.map((e: Envelope, i) => {
          const d = actuals[i] - e.planned;
          const warn = SAVE.includes(e.kind) ? d < 0 : e.kind === "want" && d > 0;
          return (
            <div key={i} className="grid grid-cols-[minmax(0,1fr)_minmax(0,9rem)] items-center gap-x-3 gap-y-1">
              <label htmlFor={`act-${i}`} className="flex items-center gap-2">
                <span aria-hidden="true" className={`size-2.5 flex-none rounded-[3px] ${KIND_BG[e.kind as Kind] ?? "bg-chart-1"}`} />
                {envLabel(t, month.method, e)}
              </label>
              <input
                id={`act-${i}`} inputMode={CURRENCIES[cur] === 0 ? "numeric" : "decimal"} value={vals[i]}
                onChange={(ev) => set(i, ev.target.value)} className={`${FIELD} text-right`}
              />
              <span className="text-[13px] tabular-nums text-muted">{fill(m.planned, { amount: money(e.planned) })}</span>
              <span className={`text-right text-[13px] tabular-nums ${warn ? "text-warning" : "text-muted"}`}>
                {d === 0 ? m.onPlan : `${d > 0 ? "+" : "−"}${formatAmount(Math.abs(d), cur, locale)}`}
              </span>
            </div>
          );
        })}
        <div role="status" className="flex flex-col gap-3">
          {gap !== 0 && (
            <p className="rounded-[10px] bg-sunken p-3 text-sm text-warning">
              {fill(gap > 0 ? m.left : m.over, { amount: money(Math.abs(gap)) })}
            </p>
          )}
          <p className="border-t border-line pt-3 text-sm tabular-nums text-muted">
            {fill(m.total, { total: money(month.income - gap), income: money(month.income), rate: `${rate} %` })}
          </p>
        </div>
      </fieldset>
      <fieldset className="flex flex-col gap-3 rounded-[14px] border border-line bg-surface p-5">
        <legend className="px-1.5 font-display text-lg font-semibold">
          {m.review} <span className="font-sans text-sm font-normal text-muted">{m.optional}</span>
        </legend>
        <label htmlFor="went-well" className="font-semibold">{m.wentWell}</label>
        <textarea id="went-well" rows={2} maxLength={500} value={well} onChange={(e) => setWell(e.target.value)} className={`${FIELD} py-2`} />
        <label htmlFor="change-next" className="font-semibold">{m.changeNext}</label>
        <textarea id="change-next" rows={2} maxLength={500} value={change} onChange={(e) => setChange(e.target.value)} className={`${FIELD} py-2`} />
      </fieldset>
      <div role="radiogroup" aria-labelledby="rating-q" className="flex flex-col gap-2.5">
        <span id="rating-q" className="font-semibold">{m.rating} <span className="font-normal text-muted">{m.optional}</span></span>
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n} type="button" role="radio" aria-checked={rating === n} aria-label={fill(m.ratingOption, { n })}
              onClick={() => setRating(rating === n ? null : n)}
              className={`min-h-12 rounded-[10px] border font-display text-lg font-semibold ${rating === n ? "border-brand bg-brand text-on-brand" : "border-line bg-surface"}`}
            >{n}</button>
          ))}
        </div>
        <div className="flex justify-between text-[13px] text-muted"><span>{m.ratingLow}</span><span>{m.ratingHigh}</span></div>
      </div>
      {err && <p role="alert" className="rounded-[10px] bg-sunken p-3 text-danger">{err}</p>}
      <button
        type="submit" disabled={gap !== 0 || sending}
        className={`${BTN} min-h-[52px] ${gap !== 0 ? "border border-line bg-sunken text-muted" : "bg-brand text-on-brand disabled:opacity-60"}`}
      >{sending ? m.sending : gap !== 0 ? m.submitBlocked : fill(m.submit, { month: name })}</button>
      <p className="text-center text-[13px] text-muted">{m.note}</p>
    </form>
  );
}

export function CloseForm({ ym, locale, t }: { ym: string; locale: Locale; t: MonthStrings }) {
  const { data, error, reload } = useApi<Month>(`/api/months/${ym}`);
  const m = t.month;
  let body;
  if (error) {
    body = (
      <div role="status" className="flex flex-col items-start gap-3 rounded-[14px] bg-sunken p-5">
        <p>{m.error}</p>
        <button type="button" onClick={reload} className={`${BTN} w-fit bg-brand text-on-brand`}>{m.retry}</button>
      </div>
    );
  } else if (!data) {
    body = <p role="status" aria-busy="true" className="min-h-svh text-muted">{m.loading}</p>;
  } else {
    body = <Form month={data} locale={locale} t={t} />;
  }
  return (
    <div className="container-site flex max-w-2xl flex-col gap-4 py-8 pb-16">
      <Link href={`/${locale}/tableau-de-bord`} className="flex min-h-11 w-fit items-center text-muted underline">← {m.back}</Link>
      {body}
    </div>
  );
}
