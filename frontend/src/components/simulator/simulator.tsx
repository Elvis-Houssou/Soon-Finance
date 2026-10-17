"use client";

import { useEffect, useState } from "react";
import methodsRaw from "@/content/methods.json";
import type { Locale } from "@/i18n/config";
import { CURRENCIES, formatAmount, MAX_INCOME_MINOR, parseAmount } from "@/lib/money";
import {
  DEFAULT_SIMULATION, loadDraft, saveDraft, totals, type MethodsData, type Simulation,
} from "@/lib/simulation";
import { useSuggestions } from "@/lib/use-suggestions";
import { Allocation } from "./allocation";
import { CustomEditor } from "./custom-editor";
import { MethodPicker } from "./method-picker";
import { FIELD, type SimStrings } from "./shared";
import { Suggestions } from "./suggestions";

const { methods } = methodsRaw as MethodsData;
type Texts = { income: string; essentials: string; savings: string };

const toText = (minor: number | null, sim: Simulation, locale: Locale) =>
  minor ? formatAmount(minor, sim.currency, locale) : "";

/** No conversion: the displayed major amount is kept, rounded half-up to the new decimals. */
function rescale(sim: Simulation, currency: string): Simulation {
  const from = CURRENCIES[sim.currency], to = CURRENCIES[currency];
  const move = (v: number) =>
    Math.min(MAX_INCOME_MINOR, to >= from ? v * 10 ** (to - from) : Math.floor((v + 10 ** (from - to) / 2) / 10 ** (from - to)));
  return {
    ...sim, currency, income: move(sim.income),
    essentials: sim.essentials === null ? null : move(sim.essentials),
    savings: sim.savings === null ? null : move(sim.savings),
  };
}

/** `?revenu=<minor>&devise=<code>&methode=<id>`: invalid values are ignored. */
function prefill(draft: Simulation): { sim: Simulation; applied: boolean } {
  const q = new URLSearchParams(window.location.search);
  const revenu = q.get("revenu") ?? "";
  const devise = (q.get("devise") ?? "").toUpperCase();
  const methode = q.get("methode") ?? "";
  const income = /^\d{1,15}$/.test(revenu) ? Number(revenu) : NaN;
  const sim = Object.hasOwn(CURRENCIES, devise) ? rescale(draft, devise) : draft;
  return {
    sim: {
      ...sim,
      ...(income <= MAX_INCOME_MINOR && { income }),
      ...(methods.some((m) => m.id === methode) && { method: methode }),
    },
    applied: q.size > 0,
  };
}

export function Simulator({ locale, t }: { locale: Locale; t: SimStrings }) {
  const [sim, setSim] = useState<Simulation | null>(null);
  const [texts, setTexts] = useState<Texts>({ income: "", essentials: "", savings: "" });
  const suggestions = useSuggestions(sim ?? DEFAULT_SIMULATION);

  // The draft lives in localStorage, so it can only be read after mount.
  useEffect(() => {
    const { sim: s, applied } = prefill(loadDraft());
    if (applied) {
      saveDraft(s);
      history.replaceState(null, "", location.pathname);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSim(s);
    setTexts({ income: toText(s.income, s, locale), essentials: toText(s.essentials, s, locale), savings: toText(s.savings, s, locale) });
  }, [locale]);

  if (!sim) return <div className="min-h-svh" aria-busy="true" />;

  const s = t.simulator;
  const method = methods.find((m) => m.id === sim.method)!;
  const update = (patch: Partial<Simulation>) => {
    const next = { ...sim, ...patch };
    setSim(next);
    saveDraft(next);
  };
  const names = new Intl.DisplayNames(locale, { type: "currency" });
  const mode = CURRENCIES[sim.currency] > 0 ? "decimal" : "numeric";
  const canSave = !method.custom || totals(sim).pct === 100;

  const onCurrency = (currency: string) => {
    const next = rescale(sim, currency);
    setSim(next);
    saveDraft(next);
    setTexts({ income: toText(next.income, next, locale), essentials: toText(next.essentials, next, locale), savings: toText(next.savings, next, locale) });
  };
  const onText = (key: keyof Texts, text: string) => {
    setTexts({ ...texts, [key]: text });
    const v = parseAmount(text, sim.currency);
    update(key === "income" ? { income: v ?? 0 } : { [key]: v });
  };
  const amountInput = (key: "essentials" | "savings", label: string, extra?: string) => (
    <>
      <label htmlFor={`f-${key}`} className="mt-1.5 font-semibold">
        {label} <span className="font-normal text-muted">{s.optional}</span>
      </label>
      <input
        id={`f-${key}`} maxLength={20} inputMode={mode} autoComplete="off" className={FIELD}
        value={texts[key]} onChange={(e) => onText(key, e.target.value)}
        {...(extra ? { "aria-describedby": `f-${key}-help` } : {})}
      />
      {extra && <span id={`f-${key}-help`} className="text-sm text-muted">{extra}</span>}
    </>
  );

  return (
    <>
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-col gap-6 lg:w-[420px] lg:shrink-0">
          <section aria-label={s.situation} className="flex flex-col gap-3 rounded-[14px] border border-line bg-surface p-5 sm:p-6">
            <label htmlFor="f-income" className="font-semibold">{s.income}</label>
            <div className="flex gap-2">
              <input
                id="f-income" maxLength={20} inputMode={mode} autoComplete="off"
                className={`${FIELD} min-h-14 flex-1 font-display text-2xl font-semibold`}
                value={texts.income} onChange={(e) => onText("income", e.target.value)}
              />
              <select
                aria-label={s.currency} value={sim.currency} onChange={(e) => onCurrency(e.target.value)}
                className={`${FIELD} min-h-14 w-28 shrink-0 font-mono`}
              >
                {Object.keys(CURRENCIES).map((c) => <option key={c} value={c}>{c} — {names.of(c)}</option>)}
              </select>
            </div>
            {amountInput("essentials", s.essentials, s.essentialsHelp)}
            <fieldset className="mt-1.5 flex flex-col gap-2">
              <legend className="mb-2 font-semibold">{s.debt}</legend>
              <div className="flex gap-2">
                {([[true, s.yes], [false, s.no]] as const).map(([v, label]) => (
                  <label
                    key={label}
                    className="relative flex min-h-11 flex-1 items-center justify-center rounded-[10px] border border-line-input font-semibold has-checked:border-brand has-checked:bg-brand has-checked:text-on-brand has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand-ink"
                  >
                    <input
                      type="radio" name="debt" checked={sim.hasDebt === v}
                      onChange={() => update({ hasDebt: v })} className="absolute inset-0 m-0 cursor-pointer opacity-0"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
            {amountInput("savings", s.savings)}
          </section>
          <section aria-label={s.pickMethod} className="flex flex-col gap-2.5">
            <h2 className="text-[17px] font-semibold">{s.pickMethod}</h2>
            <MethodPicker methods={methods} value={sim.method} onChange={(method) => update({ method })} t={t} />
          </section>
          {method.custom && <CustomEditor custom={sim.custom} onChange={(custom) => update({ custom })} t={t} />}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          {sim.income > 0 ? (
            <>
              <Allocation sim={sim} method={method} locale={locale} t={t} />
              <Suggestions {...suggestions} currency={sim.currency} locale={locale} t={t} canSave={canSave} />
            </>
          ) : (
            <p role="status" className="rounded-[14px] border border-dashed border-line-input p-8 text-lg text-muted">{s.noIncome}</p>
          )}
          <p className="text-[13px] text-muted">{s.disclaimer}</p>
        </div>
      </div>
    </>
  );
}
