"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import methodsRaw from "@/content/methods.json";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/fr";
import { formatAmount, formatMoney, parseAmount } from "@/lib/money";
import { allocate, loadDraft, saveDraft, totals, type MethodsData, type Simulation } from "@/lib/simulation";
import { AllocationBar } from "../simulator/allocation-bar";
import { FIELD, fill, KIND_BG, rowLabel, type SimStrings } from "../simulator/shared";

const { methods } = methodsRaw as MethodsData;
const OPTIONS = methods.filter((m) => !m.custom).map((m) => m.id);
const DEFAULTS = ["50-30-20", "70-20-10", "soon-10-70-20"];
const MIN = 2, MAX = 3;
type Strings = SimStrings & Pick<Dictionary, "compare">;

/** Unknown ids and duplicates dropped, capped at 3, topped up from the defaults to reach 2. */
function parseIds(param: string | null): string[] {
  const ids = [...new Set((param ?? "").split(",").filter((id) => OPTIONS.includes(id)))].slice(0, MAX);
  if (ids.length === 0) return DEFAULTS;
  for (const d of DEFAULTS) if (ids.length < MIN && !ids.includes(d)) ids.push(d);
  return ids;
}

export function Compare({ locale, t }: { locale: Locale; t: Strings }) {
  const router = useRouter();
  const [sim, setSim] = useState<Simulation | null>(null);
  const [ids, setIds] = useState<string[]>(DEFAULTS);
  const [incomeText, setIncomeText] = useState("");

  // The draft lives in localStorage, so it can only be read after mount.
  useEffect(() => {
    const s = loadDraft();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSim(s);
    setIds(parseIds(new URLSearchParams(window.location.search).get("m")));
    setIncomeText(s.income ? formatAmount(s.income, s.currency, locale) : "");
  }, [locale]);

  if (!sim) return <div className="min-h-svh" aria-busy="true" />;

  const c = t.compare;
  const money = (n: number) => formatMoney(n, sim.currency, locale);
  const name = (id: string) => t.methods[id as keyof SimStrings["methods"]].name;
  const setList = (next: string[]) => {
    setIds(next);
    window.history.replaceState(null, "", `?m=${next.join(",")}`);
  };
  const choose = (id: string) => {
    saveDraft({ ...sim, method: id });
    router.push(`/${locale}/simulateur`);
  };
  const onIncome = (text: string) => {
    setIncomeText(text);
    const next = { ...sim, income: parseAmount(text, sim.currency) ?? 0 };
    setSim(next);
    saveDraft(next);
  };
  const free = OPTIONS.filter((id) => !ids.includes(id));
  const known = sim.essentials !== null && sim.essentials > 0;

  return (
    <div className="flex flex-col gap-6">
      {sim.income === 0 && (
        <div className="flex max-w-md flex-col gap-2">
          <label htmlFor="c-income" className="font-semibold">{c.income}</label>
          <input
            id="c-income" maxLength={20} inputMode="numeric" autoComplete="off" className={FIELD}
            value={incomeText} onChange={(e) => onIncome(e.target.value)}
          />
        </div>
      )}
      {!known && <p role="note" className="text-muted">{c.hint}</p>}
      <ul aria-label={c.group} className="flex flex-wrap items-center gap-2">
        {ids.map((id) => (
          <li key={id}>
            <button
              type="button" disabled={ids.length <= MIN} aria-label={fill(c.remove, { method: name(id) })}
              onClick={() => setList(ids.filter((x) => x !== id))}
              className="flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 font-semibold disabled:text-muted"
            >
              {name(id)} <span aria-hidden="true">×</span>
            </button>
          </li>
        ))}
        <li>
          <select
            aria-label={c.addLabel} value="" disabled={ids.length >= MAX}
            onChange={(e) => e.target.value && setList([...ids, e.target.value])}
            className="min-h-11 rounded-full border border-line-input bg-surface px-4 font-semibold disabled:text-muted"
          >
            <option value="">{c.add}</option>
            {free.map((id) => <option key={id} value={id}>{name(id)}</option>)}
          </select>
        </li>
      </ul>
      <div className="grid gap-6 lg:grid-cols-3">
        {ids.map((id) => {
          const s = { ...sim, method: id };
          const rows = allocate(s);
          const { live, saved } = totals(s);
          const tight = known && live < sim.essentials!;
          return (
            <article key={id} aria-label={name(id)} className="flex min-w-0 flex-col gap-4 rounded-[14px] border border-line bg-surface p-5">
              <h2 className="font-display text-2xl font-semibold">{name(id)}</h2>
              {known && (
                <p className={`w-fit rounded-full bg-sunken px-3 py-1 text-sm font-semibold ${tight ? "text-warning" : "text-brand-ink"}`}>
                  {tight ? c.tight : c.ok}
                </p>
              )}
              <AllocationBar rows={rows} />
              <ul className="flex flex-col gap-1.5 text-[15px]">
                {rows.map((r) => (
                  <li key={r.key} className="flex items-center gap-2">
                    <span aria-hidden="true" className={`size-3 shrink-0 rounded-[4px] ${KIND_BG[r.kind]}`} />
                    <span className="min-w-0 break-words">{rowLabel(t, r)}</span>
                    <span className="ml-auto font-mono text-xs text-muted">{r.pct} %</span>
                  </li>
                ))}
              </ul>
              <dl className="grid grid-cols-2 gap-3">
                <div><dt className="text-sm text-muted">{c.live}</dt><dd className="font-display text-xl font-semibold tabular-nums">{money(live)}</dd></div>
                <div><dt className="text-sm text-muted">{c.saved}</dt><dd className="font-display text-xl font-semibold tabular-nums">{money(saved * 12)}</dd></div>
              </dl>
              {tight && <p className="text-[15px] text-warning">{fill(c.missing, { amount: money(sim.essentials! - live) })}</p>}
              <button
                type="button" onClick={() => choose(id)}
                className="mt-auto min-h-11 rounded-[10px] bg-brand px-4 font-semibold text-on-brand"
              >
                {tight ? c.detail : c.choose}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
