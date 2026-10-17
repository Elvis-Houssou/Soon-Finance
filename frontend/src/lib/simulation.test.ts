import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_SIMULATION, allocate, loadDraft, saveDraft, suggestionRequest, totals,
  type Simulation,
} from "@/lib/simulation";

const store = new Map<string, string>();
const g = globalThis as unknown as Record<string, unknown>;
const ls = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
};
beforeEach(() => {
  store.clear();
  g.window = {};
  g.localStorage = ls;
});
afterEach(() => {
  delete g.window;
  delete g.localStorage;
});

const sim = (o: Partial<Simulation>): Simulation => ({ ...DEFAULT_SIMULATION, ...o });

describe("draft", () => {
  it("loadDraft returns default when storage throws", () => {
    g.localStorage = { getItem: () => { throw new Error("blocked"); }, setItem: () => {} };
    expect(loadDraft()).toEqual(DEFAULT_SIMULATION);
  });
  it("loadDraft returns default on invalid JSON", () => {
    store.set("sf-simulation", "{nope");
    expect(loadDraft()).toEqual(DEFAULT_SIMULATION);
  });
  it("loadDraft returns default when v !== 1", () => {
    store.set("sf-simulation", JSON.stringify({ ...DEFAULT_SIMULATION, v: 2 }));
    expect(loadDraft()).toEqual(DEFAULT_SIMULATION);
  });
  it("loadDraft rejects bad shapes", () => {
    for (const bad of [
      { method: "nope" }, { currency: "ZZZ" }, { income: -1 }, { income: 1.5 },
      { income: 2e12 }, { custom: [] }, { custom: [{ name: "a", kind: "x", pct: 1 }] },
      { custom: [{ name: "a", kind: "need", pct: 101 }] }, { hasDebt: "yes" }, { savings: -3 },
    ]) {
      store.set("sf-simulation", JSON.stringify({ ...DEFAULT_SIMULATION, ...bad }));
      expect(loadDraft()).toEqual(DEFAULT_SIMULATION);
    }
  });
  it("loadDraft is SSR-safe", () => {
    delete g.window;
    expect(loadDraft()).toEqual(DEFAULT_SIMULATION);
    expect(() => saveDraft(DEFAULT_SIMULATION)).not.toThrow();
  });
  it("saveDraft then loadDraft round-trips", () => {
    const s = sim({ income: 123456, currency: "EUR", method: "custom", essentials: 5, hasDebt: true, savings: 0 });
    saveDraft(s);
    expect(loadDraft()).toEqual(s);
  });
});

describe("allocate / totals", () => {
  it("allocate soon model gives children amounts", () => {
    const a = allocate(sim({ income: 500000, method: "soon-10-70-20" }));
    const save = a.find((e) => e.key === "save-invest")!;
    expect(save.amount).toBe(350000);
    expect(save.children.find((c) => c.key === "investments")!.amount).toBe(175000);
  });
  it("allocate custom uses names and indexed keys", () => {
    const a = allocate(sim({ income: 1000, method: "custom", custom: [{ name: "Rent", kind: "need", pct: 60 }, { name: "Fun", kind: "want", pct: 40 }] }));
    expect(a.map((e) => [e.key, e.label, e.amount])).toEqual([["custom-0", "Rent", 600], ["custom-1", "Fun", 400]]);
  });
  it("totals live/saved for 50-30-20", () => {
    expect(totals(sim({ income: 500000 }))).toEqual({ pct: 100, live: 400000, saved: 100000 });
  });
});

describe("suggestionRequest", () => {
  it("is null for zero income or custom total != 100", () => {
    expect(suggestionRequest(sim({ income: 0 }))).toBeNull();
    expect(suggestionRequest(sim({ income: 10, method: "custom", custom: [{ name: "a", kind: "need", pct: 90 }] }))).toBeNull();
  });
  it("maps envelopes only for custom", () => {
    expect(suggestionRequest(sim({ income: 10 }))).toEqual({
      income: 10, currency: "XOF", method: "50-30-20", envelopes: null, essentials: null, has_debt: null, savings: null,
    });
    const c = sim({ income: 10, method: "custom", custom: [{ name: "a", kind: "need", pct: 100 }] });
    expect(suggestionRequest(c)!.envelopes).toEqual([{ kind: "need", pct: 100 }]);
  });
});
