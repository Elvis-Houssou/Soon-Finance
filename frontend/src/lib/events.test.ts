import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { track } from "./events";

const store = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
};

beforeEach(() => {
  vi.stubGlobal("localStorage", store());
  vi.stubGlobal("sessionStorage", store());
  vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 204 })));
});
afterEach(() => vi.unstubAllGlobals());

describe("track", () => {
  it("sends once per session for simulation_completed, with a stable random anon id", async () => {
    await track("simulation_completed", "fr", "XOF");
    await track("simulation_completed", "fr", "XOF");
    await track("comparison_viewed", "fr", "XOF");
    const calls = vi.mocked(fetch).mock.calls;
    expect(calls).toHaveLength(2);
    const [a, b] = calls.map((c) => JSON.parse(c[1]!.body as string));
    expect(a.anon_id).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
    expect(a.anon_id).toBe(b.anon_id);
  });
  it("never throws, even when storage and network fail", async () => {
    vi.stubGlobal("localStorage", { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } });
    await expect(track("signup_started", "en", "EUR")).resolves.toBeUndefined();
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    await expect(track("comparison_viewed", "en", "EUR")).resolves.toBeUndefined();
  });
});
