import raw from "@/content/methods.json";
import { CURRENCIES, MAX_INCOME_MINOR, split } from "@/lib/money";

export type Kind = "need" | "want" | "save" | "save2" | "give" | "learn";
export type EnvelopeData = { key: string; kind: Kind; pct: number; children: { key: string; pct: number }[] };
export type MethodData = { id: string; custom: boolean; demanding: boolean; envelopes: EnvelopeData[] };
export type MethodsData = { default: string; methods: MethodData[] };

const data = raw as MethodsData;
const KINDS: Kind[] = ["need", "want", "save", "save2", "give", "learn"];
const KEY = "sf-simulation";

export type Simulation = {
  v: 1;
  income: number;
  currency: string;
  method: string;
  custom: { name: string; kind: Kind; pct: number }[];
  essentials: number | null;
  hasDebt: boolean | null;
  savings: number | null;
};

export const DEFAULT_SIMULATION: Simulation = {
  v: 1,
  income: 0,
  currency: "XOF",
  method: data.default,
  custom: data.methods.find((m) => m.custom)!.envelopes.map((e) => ({ name: e.key, kind: e.kind, pct: e.pct })),
  essentials: null,
  hasDebt: null,
  savings: null,
};

const isAmount = (n: unknown): n is number => Number.isSafeInteger(n) && (n as number) >= 0 && (n as number) <= MAX_INCOME_MINOR;

function valid(o: unknown): o is Simulation {
  const s = o as Simulation | null;
  return (
    !!s && typeof s === "object" && s.v === 1 &&
    isAmount(s.income) &&
    typeof s.currency === "string" && Object.hasOwn(CURRENCIES, s.currency) &&
    data.methods.some((m) => m.id === s.method) &&
    (s.essentials === null || isAmount(s.essentials)) &&
    (s.savings === null || isAmount(s.savings)) &&
    (s.hasDebt === null || typeof s.hasDebt === "boolean") &&
    Array.isArray(s.custom) && s.custom.length >= 1 && s.custom.length <= 8 &&
    s.custom.every((e) =>
      !!e && typeof e.name === "string" && KINDS.includes(e.kind) &&
      Number.isInteger(e.pct) && e.pct >= 0 && e.pct <= 100)
  );
}

export function loadDraft(): Simulation {
  if (typeof window === "undefined") return DEFAULT_SIMULATION;
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "null");
    return valid(parsed) ? parsed : DEFAULT_SIMULATION;
  } catch {
    return DEFAULT_SIMULATION;
  }
}

export function saveDraft(sim: Simulation): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(sim));
  } catch {}
}

export type Allocation = {
  key: string; label?: string; kind: Kind; pct: number; amount: number;
  children: { key: string; pct: number; amount: number }[];
};

export function allocate(sim: Simulation): Allocation[] {
  const m = data.methods.find((x) => x.id === sim.method)!;
  const envs: (EnvelopeData & { label?: string })[] = m.custom
    ? sim.custom.map((e, i) => ({ key: `custom-${i}`, label: e.name, kind: e.kind, pct: e.pct, children: [] }))
    : m.envelopes;
  const amounts = split(sim.income, envs.map((e) => e.pct));
  return envs.map((e, i) => {
    const kids = split(amounts[i], e.children.map((c) => c.pct));
    return {
      key: e.key, ...(e.label !== undefined && { label: e.label }), kind: e.kind, pct: e.pct, amount: amounts[i],
      children: e.children.map((c, j) => ({ key: c.key, pct: c.pct, amount: kids[j] })),
    };
  });
}

export function totals(sim: Simulation): { pct: number; live: number; saved: number } {
  let pct = 0, live = 0, saved = 0;
  for (const e of allocate(sim)) {
    pct += e.pct;
    if (e.kind === "save" || e.kind === "save2") saved += e.amount;
    else if (e.kind === "need" || e.kind === "want" || e.kind === "learn") live += e.amount;
  }
  return { pct, live, saved };
}

/** Body for POST /api/suggestions, or null when there is nothing to ask. */
export function suggestionRequest(sim: Simulation): Record<string, unknown> | null {
  const custom = data.methods.find((m) => m.id === sim.method)?.custom ?? false;
  if (sim.income <= 0) return null;
  if (custom && sim.custom.reduce((a, e) => a + e.pct, 0) !== 100) return null;
  return {
    income: sim.income, currency: sim.currency, method: sim.method,
    envelopes: custom ? sim.custom.map(({ kind, pct }) => ({ kind, pct })) : null,
    essentials: sim.essentials, has_debt: sim.hasDebt, savings: sim.savings,
  };
}

/** Body for POST /api/onboarding (plan 1 SimulationIn). */
export function onboardingBody(sim: Simulation) {
  const custom = data.methods.find((m) => m.id === sim.method)?.custom ?? false;
  return {
    income: sim.income, currency: sim.currency, method: sim.method,
    envelopes: custom ? sim.custom.map((e) => ({ kind: e.kind, pct: e.pct, label: e.name.slice(0, 40) })) : null,
    essentials: sim.essentials, has_debt: sim.hasDebt, savings: sim.savings,
  };
}
