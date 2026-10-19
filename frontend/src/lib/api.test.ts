import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiFetch } from "./api";

const reply = (status: number, body?: unknown) =>
  vi.stubGlobal("fetch", vi.fn(async () => new Response(body === undefined ? null : JSON.stringify(body), { status })));

afterEach(() => vi.unstubAllGlobals());

describe("apiFetch", () => {
  it("renvoie le JSON", async () => {
    reply(200, { ok: 1 });
    expect(await apiFetch("/api/me")).toEqual({ ok: 1 });
  });
  it("lève ApiError avec le statut et le détail", async () => {
    reply(429, { detail: "rate_limited", retry_after: 7 });
    const err = (await apiFetch("/api/x").catch((e) => e)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(429);
    expect(err.detail).toEqual({ detail: "rate_limited", retry_after: 7 });
  });
  it("sur 401, redirige vers la connexion avec next", async () => {
    reply(401, { detail: "unauthorized" });
    const assign = vi.fn();
    vi.stubGlobal("window", { location: { pathname: "/en/bilan", search: "?m=2", assign } });
    await expect(apiFetch("/api/me")).rejects.toMatchObject({ status: 401 });
    expect(assign).toHaveBeenCalledWith("/en/connexion?next=%2Fen%2Fbilan%3Fm%3D2");
  });
  it("204 : renvoie undefined", async () => {
    reply(204);
    expect(await apiFetch("/api/events", { method: "POST" })).toBeUndefined();
  });
});
