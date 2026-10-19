import { describe, expect, it } from "vitest";
import { planDetails } from "./plan";
import { DEFAULT_SIMULATION } from "./simulation";

const sim = { ...DEFAULT_SIMULATION, income: 500000, method: "50-30-20" };

describe("planDetails", () => {
  it("estimates the reserve from the needs envelope and projects savings without interest", () => {
    const p = planDetails(sim);
    expect(p.saving).toBe(100000);
    expect(p.emergency).toEqual({ base: 250000, estimated: true, min: 750000, max: 1500000, have: 0, months: 8 });
    expect(p.projection).toEqual([
      { months: 6, total: 600000 }, { months: 12, total: 1200000 }, { months: 36, total: 3600000 }, { months: 60, total: 6000000 },
    ]);
    expect(p.step).toBe("emergency");
    expect(p.invest.map((i) => i.ready)).toEqual([true, false, false]);
  });

  it("debts come first; a funded reserve unlocks every horizon", () => {
    expect(planDetails({ ...sim, hasDebt: true, essentials: 200000, savings: 900000 }).step).toBe("debt");
    const p = planDetails({ ...sim, hasDebt: false, essentials: 200000, savings: 900000 });
    expect(p.step).toBe("invest");
    expect(p.emergency.months).toBe(0);
    expect(p.invest.every((i) => i.ready)).toBe(true);
    expect(p.projection[0].total).toBe(900000 + 6 * 100000);
  });

  it("no saving means the reserve date is unknown", () => {
    expect(planDetails({ ...sim, method: "custom", custom: [{ name: "", kind: "need", pct: 100 }] }).emergency.months).toBeNull();
  });
});
