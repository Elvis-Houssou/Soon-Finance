"use client";

import type { Kind, Simulation } from "@/lib/simulation";
import { fill, FIELD, type SimStrings } from "./shared";

const KINDS: Kind[] = ["need", "want", "save", "save2", "give", "learn"];
type Custom = Simulation["custom"];

export function CustomEditor({ custom, onChange, t }: { custom: Custom; onChange: (c: Custom) => void; t: SimStrings }) {
  const s = t.simulator;
  const total = custom.reduce((a, e) => a + e.pct, 0);
  const set = (i: number, patch: Partial<Custom[number]>) =>
    onChange(custom.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  const btn = "flex min-h-11 items-center justify-center rounded-[10px] border border-line-input px-4 font-semibold disabled:opacity-50";

  return (
    <section aria-label={s.customTitle} className="flex flex-col gap-3">
      <h2 className="text-[17px] font-semibold">{s.customTitle}</h2>
      {custom.map((e, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-[10px] border border-line p-3">
          <input
            aria-label={fill(s.name, { n: i + 1 })} className={FIELD} maxLength={40}
            value={(t.envelopes as Record<string, string>)[e.name] ?? e.name}
            onChange={(ev) => set(i, { name: ev.target.value })}
          />
          <div className="flex gap-2">
            <select
              aria-label={fill(s.kind, { n: i + 1 })} className={FIELD} value={e.kind}
              onChange={(ev) => set(i, { kind: ev.target.value as Kind })}
            >
              {KINDS.map((k) => <option key={k} value={k}>{t.kinds[k]}</option>)}
            </select>
            <input
              aria-label={fill(s.pct, { n: i + 1 })} inputMode="numeric" autoComplete="off"
              className={`${FIELD} w-20 shrink-0 text-right`} value={e.pct}
              onChange={(ev) => set(i, { pct: Math.min(100, Number(ev.target.value.replace(/\D/g, "").slice(0, 3)) || 0) })}
            />
            <button
              type="button" aria-label={fill(s.remove, { n: i + 1 })} disabled={custom.length <= 1}
              className={`${btn} w-11 shrink-0 px-0`} onClick={() => onChange(custom.filter((_, j) => j !== i))}
            >
              ×
            </button>
          </div>
        </div>
      ))}
      <button
        type="button" disabled={custom.length >= 8} className={btn}
        onClick={() => onChange([...custom, { name: "", kind: "want", pct: 0 }])}
      >
        {s.add}
      </button>
      {total !== 100 && (
        <p role="alert" className="rounded-[10px] bg-sunken px-4 py-3.5 text-[15px] text-warning">
          {fill(total < 100 ? s.under : s.over, { total, rest: Math.abs(100 - total) })}
        </p>
      )}
    </section>
  );
}
