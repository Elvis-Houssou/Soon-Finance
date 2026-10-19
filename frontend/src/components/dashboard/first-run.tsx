import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { fill } from "@/components/simulator/shared";
import { SunHorizon } from "@/components/horizon/sun-horizon";
import { envLabel, monthName } from "./format";
import type { Ctx, MonthData } from "./types";

/** Premier usage : budget du mois, soleil sous l'horizon, trois étapes (maquette TableauNouveau). */
export function FirstRun({ locale, t, month }: Ctx & { month: MonthData }) {
  const d = t.dashboard;
  const m = monthName(month.year_month, locale);
  const method = (t.methods as Record<string, { name: string }>)[month.method]?.name ?? month.method;
  const steps = [
    { title: fill(d.step1, { month: m }), text: d.done, done: true },
    { title: d.step2, text: d.step2Text, cta: [`/${locale}/objectifs`, d.step2Cta] as const },
    { title: fill(d.step3, { month: m }), text: d.step3Text },
  ];
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">{fill(d.welcome, { month: m })}</h1>
        <p className="text-lg text-muted">
          {fill(d.imported, { method, amount: formatMoney(month.income, month.currency, locale) })}
        </p>
      </div>
      <section aria-label={d.yourSplit} className="rounded-[14px] border border-line bg-surface p-5">
        <ul className="flex flex-col gap-2">
          {month.envelopes.map((e, i) => (
            <li key={i} className="flex items-center justify-between gap-4">
              <span>{envLabel(t, month.method, e)}</span>
              <strong className="tabular-nums">{formatMoney(e.planned, month.currency, locale)}</strong>
            </li>
          ))}
        </ul>
      </section>
      <section aria-label={d.horizon} className="flex flex-col gap-3 rounded-[14px] bg-tint p-5">
        <SunHorizon steps={0} label={d.sunLabelZero} />
        <p className="text-muted">{fill(d.firstSun, { month: m })}</p>
      </section>
      <section aria-label={d.startTitle} className="flex flex-col gap-3">
        <h2 className="text-[17px] font-semibold">{d.startTitle}</h2>
        <ol className="flex flex-col gap-3">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-3 rounded-[14px] border border-line bg-surface p-4">
              <span aria-hidden="true" className={`flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${s.done ? "bg-brand text-on-brand" : "bg-sunken"}`}>
                {s.done ? "✓" : i + 1}
              </span>
              <span className="flex min-w-0 flex-col gap-1">
                <strong>{s.title}</strong>
                <span className="text-muted">{s.text}</span>
                {s.cta && (
                  <Link href={s.cta[0]} className="flex min-h-11 items-center font-semibold text-brand-ink underline">{s.cta[1]}</Link>
                )}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
