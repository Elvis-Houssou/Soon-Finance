"use client";

import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { formatMoney } from "@/lib/money";
import { allocate, totals, type MethodData, type Simulation } from "@/lib/simulation";
import { AllocationBar } from "./allocation-bar";
import { envelopeLabel, KIND_BG, rowLabel, type SimStrings } from "./shared";

export function Allocation({
  sim, method, locale, t,
}: { sim: Simulation; method: MethodData; locale: Locale; t: SimStrings }) {
  const money = (n: number) => formatMoney(n, sim.currency, locale);
  const rows = allocate(sim);
  const name = t.methods[method.id as keyof SimStrings["methods"]];
  const sum = rows.reduce((a, r) => a + r.amount, 0);

  return (
    <section aria-label={t.simulator.allocation} className="flex flex-col gap-5 rounded-[14px] border border-line bg-surface p-5 sm:p-8">
      <div className="flex flex-col gap-1.5">
        <h2 className="font-display text-2xl font-semibold sm:text-3xl">{name.name}</h2>
        <p className="text-muted">{name.description}</p>
        <Link href={`/${locale}/apprendre/${method.id}`} className="flex min-h-11 w-fit items-center font-semibold text-brand-ink">
          {t.simulator.understand}
        </Link>
      </div>
      {method.demanding && (
        <p role="note" className="rounded-[10px] bg-sunken px-4 py-3.5 text-[15px] text-warning">{t.simulator.warning}</p>
      )}
      <AllocationBar rows={rows} />
      <ul className="flex flex-col gap-3">
        {rows.map((r) => {
          const label = rowLabel(t, r);
          const head = (chevron: boolean) => (
            <>
              <span className="flex min-w-0 items-center gap-2">
                {chevron && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="shrink-0 text-muted motion-safe:transition-transform group-open:rotate-180">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                )}
                <span aria-hidden="true" className={`size-3 shrink-0 rounded-[4px] ${KIND_BG[r.kind]}`} />
                <span className="min-w-0 break-words">{label}</span>
                <span className="font-mono text-xs text-muted">{r.pct} %</span>
              </span>
              <strong className="font-display text-xl font-semibold tabular-nums">{money(r.amount)}</strong>
            </>
          );
          const cls = "flex min-h-11 flex-wrap items-center justify-between gap-x-3 gap-y-1";
          return (
            <li key={r.key} className="rounded-[10px] bg-sunken px-4 py-2">
              {r.children.length ? (
                <details className="group">
                  <summary className={`${cls} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>{head(true)}</summary>
                  <ul className="flex flex-col gap-1 pb-2 pl-5 text-[15px]">
                    {r.children.map((c) => (
                      <li key={c.key} className="flex flex-wrap justify-between gap-x-3">
                        <span>{envelopeLabel(t, c.key)} <span className="font-mono text-xs text-muted">{c.pct} %</span></span>
                        <span className="tabular-nums">{money(c.amount)}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              ) : (
                <div className={cls}>{head(false)}</div>
              )}
            </li>
          );
        })}
      </ul>
      <div aria-live="polite" className="flex justify-between gap-3 border-t border-line pt-3.5 text-[15px] text-muted tabular-nums">
        <span>{t.simulator.total}</span>
        <span>{money(sum)} · {totals(sim).pct} %</span>
      </div>
    </section>
  );
}
