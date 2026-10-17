import { describe, expect, it } from "vitest";
import cases from "../../../shared/split-cases.json";
import { formatAmount, parseAmount, split } from "@/lib/money";

describe("split", () => {
  it("matches shared cases", () => {
    for (const c of cases) expect(split(c.income, c.pcts)).toEqual(c.expected);
  });
  it("distributes round(income*total/100) when total != 100", () => {
    const parts = split(1000, [30, 20]);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(500);
  });
  it("rejects invalid input", () => {
    expect(() => split(-1, [100])).toThrow(RangeError);
    expect(() => split(1.5, [100])).toThrow(RangeError);
    expect(() => split(1_000_000_000_001, [100])).toThrow(RangeError);
  });
});

describe("parseAmount", () => {
  it.each([
    ["500 000", "XOF", 500000],
    ["1 500 000 FCFA", "XOF", 1500000],
    ["1.500.000", "XOF", 1500000],
    ["1 500,50 €", "EUR", 150050],
    ["1,500.50", "EUR", 150050],
    ["12,5", "EUR", 1250],
    ["", "XOF", null],
    ["abc", "XOF", null],
    ["99999999999999", "XOF", 1000000000000],
  ])("%s %s -> %s", (t, c, e) => expect(parseAmount(t, c)).toBe(e));
});

describe("formatAmount", () => {
  it("formats per locale", () => {
    expect(formatAmount(500000, "XOF", "fr")).toBe(new Intl.NumberFormat("fr-FR").format(500000));
    expect(formatAmount(150050, "EUR", "en")).toBe("1,500.50");
  });
});
