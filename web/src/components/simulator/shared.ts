import type { Dictionary } from "@/i18n/dictionaries/fr";
import type { Allocation, Kind } from "@/lib/simulation";

export type SimStrings = Pick<Dictionary, "simulator" | "methods" | "envelopes" | "kinds" | "suggestions">;

export const fill = (text: string, vars: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));

// Static class names so Tailwind can see them.
export const KIND_BG: Record<Kind, string> = {
  need: "bg-chart-3", want: "bg-chart-2", save: "bg-chart-1", save2: "bg-chart-4", give: "bg-chart-6", learn: "bg-chart-5",
};

/** Name of an envelope: dictionary label for built-in keys, the user's own text otherwise. */
export const envelopeLabel = (t: SimStrings, key: string) =>
  (t.envelopes as Record<string, string>)[key] ?? key;

export const FIELD =
  "min-h-11 w-full min-w-0 rounded-[10px] border border-line-input bg-surface px-3 text-ink tabular-nums";

/** Label of an allocation row: custom name, its kind when blank, else the envelope name. */
export const rowLabel = (t: SimStrings, r: Allocation) =>
  r.label !== undefined ? (r.label ? envelopeLabel(t, r.label) : t.kinds[r.kind]) : envelopeLabel(t, r.key);
