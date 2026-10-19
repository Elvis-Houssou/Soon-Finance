import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { config, pickLocale, proxy } from "./proxy";

const req = (headers: Record<string, string>) => new NextRequest("http://localhost/", { headers });

describe("pickLocale", () => {
  it("suit Accept-Language", () => {
    expect(pickLocale(req({ "accept-language": "en-GB,en;q=0.9" }))).toBe("en");
  });
  it("retombe sur le français pour une langue non prise en charge", () => {
    expect(pickLocale(req({ "accept-language": "de-DE" }))).toBe("fr");
  });
  it("le cookie sf-lang l'emporte", () => {
    expect(pickLocale(req({ cookie: "sf-lang=en", "accept-language": "fr" }))).toBe("en");
  });
});

describe("proxy", () => {
  const at = (path: string) => new NextRequest(`http://localhost${path}`);

  it("redirige un chemin sans langue", async () => {
    const res = await proxy(at("/simulateur"));
    expect(res?.headers.get("location")).toMatch(/\/fr\/simulateur$/);
  });
  it("laisse passer /api et les chemins déjà préfixés", async () => {
    expect(await proxy(at("/api/health"))).toBeUndefined();
    expect(await proxy(at("/fr/simulateur"))).toBeUndefined();
  });
  it("réécrit une fiche Apprendre inconnue en 404", async () => {
    const res = await proxy(at("/fr/apprendre/xyz"));
    expect(res?.headers.get("x-middleware-rewrite")).toMatch(/\/fr\/introuvable$/);
    expect(await proxy(at("/fr/apprendre/80-20"))).toBeUndefined();
    expect(await proxy(at("/fr/apprendre"))).toBeUndefined();
  });
  it("redirige une page de compte sans session vers la connexion", async () => {
    const res = await proxy(at("/fr/tableau-de-bord"));
    expect(new URL(res!.headers.get("location")!).pathname + new URL(res!.headers.get("location")!).search).toBe(
      "/fr/connexion?next=%2Ffr%2Ftableau-de-bord",
    );
  });
  it("conserve la query string dans next", async () => {
    const res = await proxy(at("/fr/bilan?mois=2026-10"));
    expect(new URL(res!.headers.get("location")!).search).toBe("?next=%2Ffr%2Fbilan%3Fmois%3D2026-10");
  });
  it("laisse passer une page de compte avec session", async () => {
    const withCookie = new NextRequest("http://localhost/en/bilan", { headers: { cookie: "sf_session=abc" } });
    expect(await proxy(withCookie)).toBeUndefined();
  });
  describe("zone admin", () => {
    afterEach(() => vi.unstubAllGlobals());
    const admin = () => new NextRequest("http://localhost/fr/admin/impact", { headers: { cookie: "sf_session=abc" } });
    const rewritesTo404 = async () => (await proxy(admin()))?.headers.get("x-middleware-rewrite");

    it("ferme par défaut : 500, 404 et API injoignable réécrivent vers /introuvable", async () => {
      for (const stub of [() => Promise.resolve(new Response("", { status: 500 })), () => Promise.resolve(new Response("", { status: 404 })), () => Promise.reject(new Error("down"))]) {
        vi.stubGlobal("fetch", vi.fn(stub));
        expect(await rewritesTo404()).toContain("/fr/introuvable");
      }
    });
    it("renvoie vers la connexion sur 401 (session expirée)", async () => {
      vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response("", { status: 401 }))));
      const res = await proxy(admin());
      expect(res?.status).toBe(307);
      expect(res?.headers.get("location")).toContain("/fr/connexion?next=%2Ffr%2Fadmin%2Fimpact");
    });
    it("laisse passer un admin (200)", async () => {
      vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response("{}", { status: 200 }))));
      expect(await proxy(admin())).toBeUndefined();
    });
  });
  it("matcher : cible /simulateur, pas /api, /_next ni les fichiers", async () => {
    const re = new RegExp("^" + config.matcher[0] + "$");
    expect(re.test("/simulateur")).toBe(true);
    for (const p of ["/api/health", "/api", "/_next/x", "/icon.svg"]) expect(re.test(p)).toBe(false);
  });
});
