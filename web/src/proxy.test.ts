import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { pickLocale } from "./proxy";

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
