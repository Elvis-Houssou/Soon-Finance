import { allocate, totals, type Simulation } from "./simulation";

export type Horizon = "short" | "medium" | "long";
export type Step = "debt" | "emergency" | "invest";

export type Plan = {
  saving: number;
  yearly: number;
  /** Cumulated savings (current savings + monthly saving × months), without any interest. */
  projection: { months: number; total: number }[];
  emergency: { base: number; estimated: boolean; min: number; max: number; have: number; months: number | null };
  /** The first thing to do: repay debts, then build the reserve, then invest. */
  step: Step;
  invest: { horizon: Horizon; ready: boolean }[];
};

export const PROJECTION_MONTHS = [6, 12, 36, 60];

export function planDetails(sim: Simulation): Plan {
  const rows = allocate(sim);
  const saving = totals(sim).saved;
  const needs = rows.filter((r) => r.kind === "need").reduce((a, r) => a + r.amount, 0);
  const base = sim.essentials ?? needs;
  const have = sim.savings ?? 0;
  const min = 3 * base;
  const months = have >= min ? 0 : saving > 0 ? Math.ceil((min - have) / saving) : null;
  const step: Step = sim.hasDebt ? "debt" : have < min ? "emergency" : "invest";
  return {
    saving,
    yearly: saving * 12,
    projection: PROJECTION_MONTHS.map((m) => ({ months: m, total: have + saving * m })),
    emergency: { base, estimated: sim.essentials === null, min, max: 6 * base, have, months },
    step,
    // Short-term savings stay available (they build the reserve); longer horizons wait for a funded reserve and no debt.
    invest: (["short", "medium", "long"] as const).map((horizon) => ({ horizon, ready: horizon === "short" || step === "invest" })),
  };
}
