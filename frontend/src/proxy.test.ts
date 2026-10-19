import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
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

  it("redirige un chemin sans langue", () => {
    const res = proxy(at("/simulateur"));
    expect(res?.headers.get("location")).toMatch(/\/fr\/simulateur$/);
  });
  it("laisse passer les chemins déjà préfixés, pages de compte comprises (la session est vérifiée par l'API)", () => {
    for (const p of ["/fr/simulateur", "/fr/tableau-de-bord", "/en/bilan", "/fr/admin/impact"]) expect(proxy(at(p))).toBeUndefined();
  });
  it("réécrit une fiche Apprendre inconnue en 404", () => {
    const res = proxy(at("/fr/apprendre/xyz"));
    expect(res?.headers.get("x-middleware-rewrite")).toMatch(/\/fr\/introuvable$/);
    expect(proxy(at("/fr/apprendre/80-20"))).toBeUndefined();
    expect(proxy(at("/fr/apprendre"))).toBeUndefined();
  });
  it("matcher : cible /simulateur, pas /_next ni les fichiers", () => {
    const re = new RegExp("^" + config.matcher[0] + "$");
    expect(re.test("/simulateur")).toBe(true);
    for (const p of ["/_next/x", "/icon.svg"]) expect(re.test(p)).toBe(false);
  });
});
