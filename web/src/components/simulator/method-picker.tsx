"use client";

import type { MethodData } from "@/lib/simulation";
import type { SimStrings } from "./shared";

export function MethodPicker({
  methods, value, onChange, t,
}: { methods: MethodData[]; value: string; onChange: (id: string) => void; t: SimStrings }) {
  return (
    <div role="radiogroup" aria-label={t.simulator.methodGroup} className="flex flex-col gap-2">
      {methods.map((m) => {
        const label = t.methods[m.id as keyof SimStrings["methods"]];
        return (
          <label
            key={m.id}
            className="relative flex min-h-[52px] items-center justify-between gap-3 rounded-[10px] border border-line bg-surface px-4 text-left font-semibold has-checked:border-brand has-checked:bg-brand has-checked:text-on-brand has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand-ink"
          >
            <input
              type="radio" name="method" value={m.id} checked={value === m.id}
              onChange={() => onChange(m.id)}
              className="absolute inset-0 m-0 cursor-pointer opacity-0"
            />
            <span>{label.name}</span>
            <span className="text-[15px] font-normal text-muted [label:has(:checked)_&]:text-on-brand-muted">{label.hint}</span>
          </label>
        );
      })}
    </div>
  );
}
