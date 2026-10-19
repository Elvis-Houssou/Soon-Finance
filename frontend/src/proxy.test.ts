import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { config, pickLocale, proxy } from "./proxy";

const req = (headers: Record<string, string>) => new NextRequest("http://localhost/", { headers });

describe("pickLocale", async () => {
  it("suit Accept-Language", async () => {
    expect(pickLocale(req({ "accept-language": "en-GB,en;q=0.9" }))).toBe("en");
  });
  it("retombe sur le français pour une langue non prise en charge", async () => {
    expect(pickLocale(req({ "accept-language": "de-DE" }))).toBe("fr");
  });
  it("le cookie sf-lang l'emporte", async () => {
    expect(pickLocale(req({ cookie: "sf-lang=en", "accept-language": "fr" }))).toBe("en");
  });
});

describe("proxy", async () => {
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
  it("matcher : cible /simulateur, pas /api, /_next ni les fichiers", async () => {
    const re = new RegExp("^" + config.matcher[0] + "$");
    expect(re.test("/simulateur")).toBe(true);
    for (const p of ["/api/health", "/api", "/_next/x", "/icon.svg"]) expect(re.test(p)).toBe(false);
  });
});
