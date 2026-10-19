"use client";

import Link from "next/link";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/fr";
import { CURRENCIES, formatAmount, MAX_INCOME_MINOR, parseAmount, split } from "@/lib/money";
import { DUR } from "@/lib/motion";
import type { Allocation } from "@/lib/simulation";
import methods from "@/content/methods.json";
import { CountUp } from "../motion/count-up";
import { HorizonReveal } from "../motion/horizon-reveal";
import { AllocationBar } from "../simulator/allocation-bar";
import { envelopeLabel, FIELD, KIND_BG } from "../simulator/shared";

const EXAMPLE = 500_000;
const envs = methods.methods.find((m) => m.id === "50-30-20")!.envelopes;

type Props = { locale: Locale; t: Pick<Dictionary, "home" | "envelopes" | "kinds" | "simulator" | "methods" | "suggestions"> };

export function QuickStart({ locale, t }: Props) {
  const [text, setText] = useState("");
  const [currency, setCurrency] = useState("XOF");
  const names = new Intl.DisplayNames(locale, { type: "currency" });

  const parsed = parseAmount(text, currency);
  const income = parsed && parsed <= MAX_INCOME_MINOR ? parsed : 0;
  const isExample = income === 0;
  const shown = isExample ? EXAMPLE * 10 ** CURRENCIES[currency] : income;
  const amounts = split(shown, envs.map((e) => e.pct));
  const rows: Allocation[] = envs.map((e, i) => ({ key: e.key, kind: e.kind as Allocation["kind"], pct: e.pct, amount: amounts[i], children: [] }));
  const href = `/${locale}/simulateur` + (income ? `?revenu=${income}&devise=${currency}` : "");

  return (
    <div className="flex flex-col gap-4 rounded-[14px] border border-line bg-surface p-5 sm:p-6">
      <label htmlFor="qs-income" className="font-semibold">{t.home.income}</label>
      <div className="flex gap-2">
        <input
          id="qs-income" maxLength={20} inputMode={CURRENCIES[currency] > 0 ? "decimal" : "numeric"} autoComplete="off" placeholder="500 000"
          className={`${FIELD} min-h-14 flex-1 font-display text-2xl font-semibold`}
          value={text} onChange={(e) => setText(e.target.value)}
        />
        {/* w-28! : FIELD porte w-full, généré après w-28 dans la feuille de style. */}
        <select
          aria-label={t.home.currency} value={currency} onChange={(e) => setCurrency(e.target.value)}
          className={`${FIELD} min-h-14 w-28! shrink-0 font-mono`}
        >
          {Object.keys(CURRENCIES).map((c) => <option key={c} value={c}>{c} — {names.of(c)}</option>)}
        </select>
      </div>
      <div className="flex items-baseline justify-between gap-2 text-sm text-muted">
        <span>{t.home.preview}</span>
        {isExample && <span>{t.home.example}</span>}
      </div>
      {/* Votre revenu remplace l'exemple (ou la devise change) : la barre se redessine depuis la gauche. */}
      <AllocationBar rows={rows} replay={`${isExample}|${currency}`} />
      <ul className="flex flex-col gap-2">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center gap-3">
            <span aria-hidden="true" className={`size-3 shrink-0 rounded-full ${KIND_BG[r.kind]}`} />
            <span className="flex-1">{envelopeLabel(t, r.key)} · {r.pct} %</span>
            <CountUp value={r.amount} format={(n) => formatAmount(n, currency, locale)} duration={DUR.view} className="font-semibold tabular-nums" />
          </li>
        ))}
      </ul>
      {/* Le CTA principal arrive en dernier dans la séquence du hero. */}
      <HorizonReveal firstLoad delay={0.8}>
        <Link href={href} className="flex min-h-12 items-center justify-center rounded-[10px] bg-brand px-5 font-semibold text-on-brand">
          {t.home.cta}
        </Link>
      </HorizonReveal>
    </div>
  );
}
